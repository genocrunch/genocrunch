# -*- coding: utf-8 -*-
#genocrunchlib.py

import os, sys, argparse, tarfile
from json import load, loads, dump
from subprocess import Popen, PIPE
from shutil import copyfile, move, rmtree
from itertools import izip
from collections import OrderedDict
from tempfile import mkdtemp, NamedTemporaryFile
from random import choice
from string import ascii_uppercase, digits
from copy import copy
from datetime import datetime

__dir__ = os.path.dirname(__file__)
main_dir = '/'.join(__dir__.split('/')[0:len(__dir__.split('/'))-1])

def Error(f=__file__, msg='', to_rm=[]):

    print 'Error ['+ os.path.basename(f) +']: '+ msg
    if len(to_rm) > 0:
      for t in to_rm:
        rmtree(t)
    raise SystemExit(1)


def Warning(f=__file__, msg=''):

    print 'Warning ['+ os.path.basename(f) +']: '+ msg


def mkdir(dp=''):
    """Create a directory if not already present
       Args:
           dp  Directory path
    """

    if not os.path.exists(dp):
      os.makedirs(dp)
    return 0

def rand(n=1):
    """Generate a random string
       n  Length of the random string
    """

    return ''.join(choice(ascii_uppercase + digits) for _ in range(n))

class Parameters(object):
    """Parameters retrieved from  genocrunchlib.json, from user's json and passed in command line"""

    def __init__(self, json_fp=''):
        """Populate the object
             json_fp  Json file path
        """

        # Set authorized arguments for cli
        argument_parser = argparse.ArgumentParser()
        argument_parser._action_groups.pop()
        required_arguments = argument_parser.add_argument_group('required arguments')
        optional_arguments = argument_parser.add_argument_group('optional arguments')
        optional_arguments.add_argument('--params_fp',
                                        help='Path to a JSON file containing parameters.',
                                        nargs=1,
                                        type=str)
        optional_arguments.add_argument('--analysis',
                                        help='List of analysis to perform (comma-separated). Valid choices: proportions,diversity,adonis,pca,pcoa,heatmap,change,correlation_network,clustering,similarity_network',
                                        nargs=1,
                                        default='proportions,pcoa',
                                        type=str)
        required_arguments.add_argument('--output',
                                        help='Path to output directory.',
                                        nargs=1,
                                        type=str)

        # Define parameters based on the json
        self.json_fp = json_fp
        with open(self.json_fp, 'r') as f:
          self.json_s = load(f)

        self.fps = []
        required = []
        for key, value in self.json_s.get('fields').iteritems():
          for val in value:
            if 'scope' not in val.keys() or val.get('scope') != 'form_only':
              if 'default' in val.keys():
                default = val.get('default')
              else:
                default=None
              # Add authorized cli arguments from the json
              if 'optional' in val.keys() and val.get('optional') == False:
                required.append(val.get('id'))
                required_arguments.add_argument('--'+val.get('id'),
                                                help=val.get('help'),
                                                nargs=1,
                                                default=default,
                                                type=str)
              else:
                optional_arguments.add_argument('--'+val.get('id'),
                                                help=val.get('help'),
                                                nargs=1,
                                                default=default,
                                                type=str)
              if val.get('type') == 'file':
                self.fps.append(val.get('id')) 

        # Retrieve cli arguments
        self.params = argument_parser.parse_args().__dict__
        
        # Set params values from user's json if provided (does not overwrite parameters passed in command line)
        # Careful with booleans as form checkboxes return 1 or nothing...
        for key, value in self.params.iteritems():
          if isinstance(value, list):
            self.params[key] = value[0]

        if self.params['params_fp'] is not None and os.path.exists(self.params['params_fp']):
          with open(self.params.get('params_fp'), 'r') as f:
            params = load(f)
          for key, value in params.items():
            if '--'+key not in sys.argv[1:]:
              if value in ['', [], ['']]:
                self.params[key] = None
              else:
                self.params[key] = value

          # Handle booleans
          for e in ['prim_rarefaction', 'sec_rarefaction']:
            if e not in params.keys():
              self.params[e] = False
            elif params[e] in ['', ' ', '0']:
              self.params[e] = False
            else:
              self.params[e] = bool(params[e])

        if '--analysis' in sys.argv[1:]:
          for a in self.params['analysis'].split(','):
            self.params[a] = 1
        self.params.pop('analysis')

        for key, value in self.params.iteritems():
          if value is not None:
            if isinstance(value, str) and len(value.split(',')) > 1:
              self.params[key] = value.split(',')
          elif key in required:
            Error(msg='argument --'+key+' is requireds')

        # Check that all files exist
        missing = []
        for fp in self.fps:
          if self.params[fp] is not None and not os.path.exists(self.params[fp]):
            missing.append('--'+fp+' '+self.params[fp])
        if len(missing) > 0:
          Error(msg='The following file(s) were not found: '+' ,'.join(missing))

    def write(self, fp=''):
        """Write all parameters to a file
           fp  File path
        """

        with open(fp, 'w') as f:
          dump(self.params, f, indent=2)


def table2R(fp):
    """Adapt file format for easy loading in R:
       Remove comments from the top of the file (also empty first element of first line)
    """
    sub = Popen([main_dir+'/bin/modify_table.sh',
                            fp,
                            'table2R',
                            fp])
    sub.wait()


def stdoutLog2json(stdout):
    """Convert stdout to json string"""

    return loads('[{'+'"},{"'.join(stdout.read().split('""'))+'}]')


class Log(object):
    """A log file"""

    def __init__(self, fp):

        self.fp = fp
        self.data = []
        self.update()

    def update(self):
        """Write log data to file"""

        with open(self.fp, 'w') as f:
          dump(self.data, f, indent=2)

        self.secure(self.fp+'.safe')


    def secure(self, fp=None):
        """Remove absolute paths from the log"""

        if fp is None:
          fp = self.fp

        path_to_hide = os.path.dirname(self.fp)
        f = open(self.fp, 'r')
        content = f.read()
        f.close()
        new_content = content.replace(path_to_hide,'')
        f = open(fp, 'w')
        f.write(new_content)
        f.close()

    def wrapup(self):
        """Update pending and runing status to failed and update"""

        f = open(self.fp, 'r')
        content = f.read()
        f.close()
        new_content = content.replace('running','failed').replace('pending','failed')
        f = open(self.fp, 'w')
        f.write(new_content)
        f.close()
        self.secure(self.fp+'.safe')

class Archive(object):
    """An archive"""

    def __init__(self, target_fp='', name=None):

        self.fp = target_fp
        self.source = []
        self.add(name)

    def add(self, name=None, update=False, generate=True):
        """Add files to the archive"""

        if name is not None:
          if isinstance(name, list):
            self.source = list(set(self.source + name))
          else:
            self.source = list(set(self.source + [name]))

          if update and generate:
            self.update()
          elif generate:
            with tarfile.open(self.fp, "w:gz") as archive:
              archive.add(name)


    def update(self):
        """Update files in archive"""

        if os.path.exists(self.fp):
          tmp = NamedTemporaryFile(delete=False, dir=os.path.dirname(self.fp))
          os.rename(self.fp, tmp.name)

        with tarfile.open(self.fp, "w:gz") as archive:
          for e in self.source:
            archive.add(e)


class Map(object):
    """Mapping file"""

    def __init__(self, fp, output):

        self.fp = output+'/map.txt'
        copyfile(fp, self.fp)
        table2R(self.fp)
        self.log = []
        self.log.append({'name':'file', 'type':'file', 'path':self.fp})
        self.log.append({'name':'validation', 'type':'validation', 'status':'pending', 'messages':[]})

    def validate(self):

        log = [e for e in self.log if e['name'] == 'validation'][0]
        log['status'] = 'running'
        start_time = datetime.now()
        log['start_time'] = str(start_time)
        sub = Popen([main_dir+'/bin/validate_format.R',
                     '-m',
                     'validate_map',
                     '--map',
                     self.fp],
                     stdout=PIPE,
                     stderr=PIPE)
        sub.wait()
        log['status'] = 'completed'
        log['messages'] = stdoutLog2json(sub.stdout)

        if len([e for e in log['messages'] if 'error' in e.keys()]) > 0:
          log['status'] = 'failed'
          Error(msg='Error detected in '+self.fp) 
        log['status'] = 'completed'
        log['execution_time'] = str(datetime.now() - start_time)

class DataSet(object):
    """Dataset"""

    _pipeline = [{'name':'pre-processing', 'fun':'preProcess', 'operations':[
                   'filtering',
                   'binning'
                 ]},
                 {'name':'transformation', 'fun':'transform', 'operations':[
                   'rarefaction',
                   'transformation',
                   'batch_effect_suppression'
                 ]}
                ]

    def __init__(self,
                 json_fp = '',
                 pipeline = [],
                 data_fp = '',
                 output = '',
                 map = '',
                 category_column = '',
                 abundance_threshold = '',
                 abundance_threshold_type = '',
                 presence_threshold = '',
                 presence_threshold_type = '',
                 bin_levels = [],
                 bin_fun = '',
                 rarefy = False,
                 rarefaction_depth = '',
                 nsampling = '',
                 transformation = '',
                 batch_effect = '',
                 batch_effect_fun = ''):

        self.json_fp = json_fp
        self.pipeline = self._pipeline
        if pipeline != []:
          self.pipeline = pipeline

        self.output = output
        self.data_fp = [self.output+'/'+os.path.basename(data_fp)]
        self.tmpdir = os.path.normpath(self.output+'/../'+mkdtemp())
        mkdir(self.tmpdir)
        copyfile(data_fp, self.data_fp[0])
        table2R(self.data_fp[0])
        self.map = map
        self.category_column = category_column
        self.abundance_threshold = abundance_threshold
        self.abundance_threshold_type = abundance_threshold_type
        self.presence_threshold = presence_threshold
        self.presence_threshold_type = presence_threshold_type
        self.bin_levels = bin_levels
        self.bin_fun = bin_fun
        self.rarefy = rarefy
        self.rarefaction_depth = rarefaction_depth
        self.nsampling = nsampling
        self.transformation = transformation
        self.batch_effect = batch_effect
        self.batch_effect_fun = batch_effect_fun

        self.log = []
        self.log.append({'name':'file', 'type':'file', 'path':self.data_fp[0]})
        self.log.append({'name':'validation', 'type':'validation', 'status':'pending', 'messages':[]})
        self.log.append({'name':'sorting', 'type':'operation', 'status':'pending', 'messages':[]})
        for p in self.pipeline:
          op = []
          for e in p['operations']:
            op.append({'name':e, 'status':'pending', 'messages':[]})
          self.log.append({'name':p['name'], 'type':'step', 'operations':op})
        op = []
        self.stdout = []
        self.stderr = []

    def validate(self):
        log = [e for e in self.log if e['name'] == 'validation'][0]
        log['status'] = 'running'
        start_time = datetime.now()
        log['start_time'] = str(start_time)
        for fp in self.data_fp:
          sub = Popen([main_dir+'/bin/validate_format.R',
                       '-t',
                       fp,
                       '-m',
                       'validate_dataset',
                       '--map',
                       self.map.fp,
                       '--category_column',
                       str(self.category_column)],
                       stdout=PIPE,
                       stderr=PIPE)
          sub.wait()
          log['messages'].extend(stdoutLog2json(sub.stdout))
        log['status'] = 'completed'
        log['execution_time'] = str(datetime.now() - start_time)

    def sort(self):

        log = [e for e in self.log if e['name'] == 'sorting'][0]
        log['status'] = 'running'
        start_time = datetime.now()
        log['start_time'] = str(start_time)
        tmp = NamedTemporaryFile(delete=False, dir=self.tmpdir)
        for fp in self.data_fp:
          sub = Popen([main_dir+'/bin/modify_table.R',
                                  '-t',
                                  fp,
                                  '-m',
                                  'sorting',
                                  '--map',
                                  self.map.fp,
                                  '--ignore',
                                  str(self.category_column),
                                  '-o',
                                  fp,
                                  '--log',
                                  str(tmp.name)],
                                  stdout=PIPE,
                                  stderr=PIPE)
          sub.wait()
          self.appendStdout(sub.stdout.read())
          self.appendStderr(sub.stderr.read())
        if os.path.exists(tmp.name):
          with open(tmp.name, 'r') as t:
            log['messages'].extend(stdoutLog2json(t))
          os.remove(tmp.name)
        tmp.close()
        log['status'] = 'completed'
        log['execution_time'] = str(datetime.now() - start_time)

    def preProcess(self, fun=''):

        log = [e for e in [o for o in self.log if o['name'] == 'pre-processing'][0]['operations'] if e['name'] == fun][0]
        log['status'] = 'running'
        start_time = datetime.now()
        log['start_time'] = str(start_time)
        tmp = NamedTemporaryFile(delete=False, dir=self.tmpdir)
        args = [main_dir+'/bin/modify_table.R',
                '-m',
                fun,
                '--log',
                str(tmp.name)]

        if fun == 'filtering':
          if (self.abundance_threshold is None or self.abundance_threshold == 0) and (self.presence_threshold is None or self.presence_threshold == 0):
            log['status'] = 'skipped'
            return(0)
          args.extend(['--column',
                       str(self.category_column),
                       '--abundance_threshold',
                       self.abundance_threshold,
                       '--abundance_threshold_type',
                       self.abundance_threshold_type,
                       '--presence_threshold',
                       self.presence_threshold,
                       '--presence_threshold_type',
                       self.presence_threshold_type])
        elif fun == 'binning':
          if self.bin_levels is None:
            log['status'] = 'skipped'
            return(0)
          args.extend(['--column',
                       str(self.category_column),
                       '--fun',
                       self.bin_fun])

        output_fps = []
        for fp in self.data_fp:
          args.extend(['-t', fp])
          if fun == 'filtering':
            output_fp = fp +'_filtered.txt'
            output_fps.append(output_fp)
            args.extend(['-o', output_fp])
            sub = Popen(args, stdout=PIPE, stderr=PIPE)
            sub.wait()
            self.appendStdout(sub.stdout.read())
            self.appendStderr(sub.stderr.read())

          elif fun == 'binning':
            vstyle = 2 if len(self.bin_levels) > 1 else 1
            for level in self.bin_levels:
              output_fp = fp+'_lvl'+level+'.txt'
              output_fps.append(output_fp)
              args.extend(['--level', level,
                           '--vstyle', str(vstyle),
                           '-o', output_fp])
              sub = Popen(args, stdout=PIPE, stderr=PIPE)
              sub.wait()
              self.appendStdout(sub.stdout.read())
              self.appendStderr(sub.stderr.read())
              vstyle = 3
        if os.path.exists(tmp.name):
          with open(tmp.name, 'r') as t:
            log['messages'].extend(stdoutLog2json(t))
          os.remove(tmp.name)
        tmp.close()
        log['status'] = 'completed'
        log['execution_time'] = str(datetime.now() - start_time)
        self.data_fp = output_fps

    def transform(self, fun=''):

        log = [e for e in [o for o in self.log if o['name'] == 'transformation'][0]['operations'] if e['name'] == fun][0]
        log['status'] = 'running'
        start_time = datetime.now()
        log['start_time'] = str(start_time)
        tmp = NamedTemporaryFile(delete=False, dir=self.tmpdir)
        args = [main_dir+'/bin/modify_table.R',
                '--log',
                str(tmp.name),
                '--ignore',
                str(self.category_column)]

        if fun == 'rarefaction':
          if self.rarefy is None or self.rarefy == False:
            log['status'] = 'skipped'
            return(0)
          args.extend(['-m',
                       'rarefaction',
                       '--sample',
                       self.rarefaction_depth,
                       '--nsampling',
                       self.nsampling])

        elif fun == 'transformation':
          if self.transformation is None or self.transformation in ['none', '', ' ']:
            log['status'] = 'skipped'
            return(0)
          args.extend(['-m', self.transformation])

        elif fun == 'batch_effect_suppression':
          if self.batch_effect is None:
            log['status'] = 'skipped'
            return(0)
          args.extend(['-m',
                       'batch_effect_suppression',
                       '--map',
                       self.map.fp,
                       '--effect',
                       self.batch_effect,
                       '--fun',
                       self.batch_effect_fun])

        suffix = {'rarefaction':'rar',
                  'transformation':'trans',
                  'batch_effect_suppression':'bes'}
        output_fps = []
        vstyle = 1
        for fp in self.data_fp:
          output_fp = ('.').join(fp.split('.')[:-1])+'_'+suffix[fun]+'.txt'
          output_fps.append(output_fp)
          args.extend(['-t', fp,
                       '--vstyle', str(vstyle),
                       '-o', output_fp])
          sub = Popen(args, stdout=PIPE, stderr=PIPE)
          sub.wait()
          self.appendStdout(sub.stdout.read())
          self.appendStderr(sub.stderr.read())
          vstyle = 2
        if os.path.exists(tmp.name):
          with open(tmp.name, 'r') as t:
            log['messages'].extend(stdoutLog2json(t))
          os.remove(tmp.name)
        tmp.close()
        log['status'] = 'completed'
        log['execution_time'] = str(datetime.now() - start_time)
        self.data_fp = output_fps

    def appendStdout(self, stdout):

        if stdout is not None and stdout != '':
          self.stdout.append(stdout)

    def appendStderr(self, stderr):

        if stderr is not None and stderr != '':
          self.stderr.append(stderr)


class Analysis(object):
    """THE ANALYSIS"""

    def __init__(self, json_fp):
        """initialize the analysis pipeline
           json_fp  File path to json
        """

        # INITIALIZE THE PIPELINE
        self.pipeline = [{'name':'diversity', 'before_step':'transformation', 'status':'pending', 'messages':[]},
                         {'name':'clustering', 'before_step':'analysis', 'status':'pending', 'messages':[]},
                         {'name':'similarity_network', 'before_step':'analysis', 'status':'pending', 'messages':[]},
                         {'name':'proportions', 'status':'pending', 'messages':[]},
                         {'name':'adonis', 'status':'pending', 'messages':[]},
                         {'name':'pca', 'status':'pending', 'messages':[]},
                         {'name':'ca', 'status':'pending', 'messages':[]},
                         {'name':'pcoa', 'status':'pending', 'messages':[]},
                         {'name':'cca', 'status':'pending', 'messages':[]},
                         {'name':'heatmap', 'status':'pending', 'messages':[]},
                         {'name':'change', 'status':'pending', 'messages':[]},
                         {'name':'correlation_network', 'status':'pending', 'messages':[]}]

        # Set parameters from json
        self.parameters = Parameters(json_fp)

        # Make the output directory
        self.output = self.parameters.params['output']
        if os.path.exists(self.output):
          rmtree(self.output)
        mkdir(self.output)
        self.tmpdir = os.path.normpath(self.output+'/../'+mkdtemp())
        mkdir(self.tmpdir)
        self.to_rm = [self.tmpdir]

        # Set the archive
        #self.archive = Archive(self.output+'/output.tar.gz')
        # Store parameters to output directory
        self.parameters.write(self.output+'/params.json')

        # Start logging
        self.log = Log(self.output+'/log.json')
        self.stdout = Log(self.output+'/stdout.log')
        self.stderr = Log(self.output+'/stderr.log')

    def run(self):
        """Run the analysis"""

        # Create data sets
        self.map = Map(self.parameters.params['map'],
                       self.output)
        self.log.data.append({'name':'map', 'type':'map', 'log':self.map.log})
        self.log.update()
        #self.archive.add(self.log.fp+'.safe', update=False, generate=False)
        log = [e for e in self.map.log if e['name'] == 'validation'][0]
        log['status'] = 'running'
        self.log.update()
        self.map.validate()

        if len([e for e in log['messages'] if 'error' in e.keys()]) > 0:
          log['status'] = 'failed'
          self.log.update()
          Error(msg='Error detected in '+self.map.fp, to_rm=self.to_rm) 
        self.log.update()

        if self.parameters.params['bin_levels'] is None or isinstance(self.parameters.params['bin_levels'], list):
          bin_levels = self.parameters.params['bin_levels']
        else:
          bin_levels = self.parameters.params['bin_levels'].split(',')

        self.primary_dataset = DataSet(json_fp = self.parameters.json_fp,
                                       data_fp = self.parameters.params['primary_dataset'],
                                       output = self.output,
                                       map = self.map,
                                       category_column = self.parameters.params['category_column'],
                                       abundance_threshold = self.parameters.params['abundance_threshold'],
                                       abundance_threshold_type = self.parameters.params['abundance_threshold_type'],
                                       presence_threshold = self.parameters.params['presence_threshold'],
                                       presence_threshold_type = self.parameters.params['presence_threshold_type'],
                                       bin_levels = bin_levels,
                                       bin_fun = self.parameters.params['bin_fun'],
                                       rarefy = bool(self.parameters.params['prim_rarefaction']),
                                       rarefaction_depth = self.parameters.params['prim_sampling_depth'],
                                       nsampling = self.parameters.params['prim_nsampling'],
                                       transformation = self.parameters.params['prim_trans_method'],
                                       batch_effect = self.parameters.params['prim_batch_effect_suppression'],
                                       batch_effect_fun = self.parameters.params['prim_batch_effect_suppression_fun'])
        self.log.data.append({'name':'primary_dataset', 'type':'dataset', 'log':self.primary_dataset.log})
        self.log.update()
        self.stdout.data.append({'primary_dataset':self.primary_dataset.stdout})
        self.stderr.data.append({'primary_dataset':self.primary_dataset.stderr})
        self.to_rm.append(self.primary_dataset.tmpdir)
        #self.archive.add(self.primary_dataset.data_fp, update=False, generate=False)

        log = [e for e in self.primary_dataset.log if e['name'] == 'validation'][0]
        log['status'] = 'running'
        self.log.update()
        self.primary_dataset.validate()
        if len([e for e in log['messages'] if 'error' in e.keys()]) > 0:
          log['status'] = 'failed'
          self.log.update()
          Error(msg='Error detected in primary_dataset.validate()', to_rm=self.to_rm) 
        self.log.update()

        log = [e for e in self.primary_dataset.log if e['name'] == 'sorting'][0]
        log['status'] = 'running'
        self.log.update()
        self.primary_dataset.sort()
        self.stdout.update()
        self.stderr.update()
        if len([e for e in log['messages'] if 'error' in e.keys()]) > 0:
          log['status'] = 'failed'
          self.log.update()
          Error(msg='See'+self.log.fp+'.', to_rm=self.to_rm) 
        self.log.update()

        if self.parameters.params['secondary_dataset'] is not None:
          self.secondary_dataset = DataSet(json_fp = self.parameters.json_fp,
                                           pipeline = [{'name':'transformation',
                                                        'fun':'transform',
                                                        'operations':['rarefaction',
                                                                      'transformation',
                                                                      'batch_effect_suppression']}],
                                           data_fp = self.parameters.params['secondary_dataset'],
                                           output = self.output,
                                           map = self.map,
                                           category_column = '',
                                           rarefy = bool(self.parameters.params['sec_rarefaction']),
                                           rarefaction_depth = self.parameters.params['sec_sampling_depth'],
                                           nsampling = self.parameters.params['sec_nsampling'],
                                           transformation = self.parameters.params['sec_trans_method'],
                                           batch_effect = self.parameters.params['sec_batch_effect_suppression'],
                                           batch_effect_fun = self.parameters.params['prim_batch_effect_suppression_fun'])
          self.log.data.append({'name':'secondary_dataset', 'type':'dataset', 'log':self.secondary_dataset.log})
          self.log.update()
          self.stdout.data.append({'secondary_dataset':self.secondary_dataset.stdout})
          self.stderr.data.append({'secondary_dataset':self.secondary_dataset.stderr})
          self.to_rm.append(self.secondary_dataset.tmpdir)

          log = [e for e in self.secondary_dataset.log if e['name'] == 'validation'][0]
          log['status'] = 'running'
          self.log.update()
          self.secondary_dataset.validate()
          if len([e for e in log['messages'] if 'error' in e.keys()]) > 0:
            log['status'] = 'failed'
            self.log.update()
            Error(msg='Error detected in secondary_dataset.validate()', to_rm=self.to_rm) 
          self.log.update()

          log = [e for e in self.secondary_dataset.log if e['name'] == 'sorting'][0]
          log['status'] = 'running'
          self.log.update()
          self.secondary_dataset.sort()
          self.stdout.update()
          self.stderr.update()
          if len([e for e in log['messages'] if 'error' in e.keys()]) > 0:
            log['status'] = 'failed'
            self.log.update()
            Error(msg='See'+self.log.fp+'.', to_rm=self.to_rm)
          self.log.update()

        # RUN DATASET PIPELINE
        self.log.data.append({'name':'analysis', 'type':'analysis', 'log':self.pipeline})
        self.stdout.data.append({'analysis':[]})
        self.stderr.data.append({'analysis':[]})

        datasets = [self.primary_dataset]
        if self.parameters.params['secondary_dataset'] is not None:
          datasets.append(self.secondary_dataset)

        for dataset in datasets:
          for step in dataset.pipeline:
            if dataset == datasets[0]:
              analyses = [a for a in [e for e in self.pipeline if 'before_step' in e.keys()] if a['before_step'] == step['name']]
              for analysis in analyses:
                eval('self.analysis("'+analysis['name']+'")')

            for operation in step['operations']:
              log = [o for o in [ s for s in dataset.log if s['name'] == step['name']][0]['operations'] if o['name'] == operation][0]
              log['status'] = 'running'
              self.log.update()
              eval('dataset.'+step['fun']+'("'+operation+'")')
              self.stdout.update()
              self.stderr.update()
              if len([e for e in log['messages'] if 'error' in e.keys()]) > 0:
                log['status'] = 'failed'
                self.log.update()
                Error(msg='See'+self.log.fp+'.', to_rm=self.to_rm) 
              self.log.update()

        # COMPLETE ANALYSIS PIPELINE
        analyses = [a for a in [e for e in self.pipeline if 'before_step' in e.keys()] if a['before_step'] == 'analysis']
        for analysis in analyses:
          eval('self.analysis("'+analysis['name']+'")')
        analyses = [a for a in [e for e in self.pipeline if 'before_step' not in e.keys()]]

        for analysis in analyses:
          eval('self.analysis("'+analysis['name']+'")')
        self.cleanup()


    def cleanup(self):

        self.log.wrapup()
        self.stdout.update()
        self.stderr.update()
        #self.archive.update()

        for t in self.to_rm:
          rmtree(t)


    def analysis(self, method=''):
        """Run R scripts to generate figures and stats"""

        log = [e for e in [l for l in self.log.data if l['name'] == 'analysis'][0]['log'] if e['name'] == method][0]
        stdout = [ e for e in self.stdout.data if e.keys()[0] == 'analysis'][0]['analysis']
        stderr = [ e for e in self.stderr.data if e.keys()[0] == 'analysis'][0]['analysis']

        if method not in self.parameters.params.keys() or self.parameters.params[method] == 0:
          log['status'] = 'skipped'
          self.log.update()
          return(0)

        log['status'] = 'running'
        start_time = datetime.now()
        log['start_time'] = str(start_time)
        self.log.update()
        append_to_map = False
        output = self.output+'/'+method
        mkdir(output)
        tmp = NamedTemporaryFile(delete=False, dir=self.tmpdir)

        # Set general arguments
        args = [main_dir+'/bin/analyse_table.R',
                '--graphical',
                'TRUE',
                '--log',
                str(tmp.name),
                '--method',
                method,
                '--map',
                self.map.fp,
                '--category',
                self.primary_dataset.category_column]

        # Set analysis-specific arguments
        if method == 'diversity':
          if self.parameters.params['diversity_metric'] is not None:
            args.extend(['--fun',
                         ','.join(self.parameters.params['diversity_metric'])])
          if self.parameters.params['compare_diversity'] is not None:
            args.extend(['--compare_diversity',
                         self.parameters.params['compare_diversity']])

        elif method == 'clustering':
          append_to_map = True
          if self.parameters.params['clustering_fun'] is not None:
            clustering_fun = self.parameters.params['clustering_fun']
            if isinstance(clustering_fun, list):  # NOT SUPPORTED BY R SCRIPT YET
              clustering_fun = ','.join(clustering_fun)
            args.extend(['--fun',
                         clustering_fun])

        elif method == 'adonis':
          if self.parameters.params['adonis_model'] is not None:
            adonis_model = self.parameters.params['adonis_model']
            if isinstance(adonis_model, list):
              adonis_model = ','.join(adonis_model)
            args.extend(['--adonis_model',
                         adonis_model])
          if self.parameters.params['adonis_distfun'] is not None:
            adonis_distfun = self.parameters.params['adonis_distfun']
            if isinstance(adonis_distfun, list):
              adonis_distfun = ','.join(adonis_distfun)
            args.extend(['--fun',
                         adonis_distfun])
          if self.parameters.params['adonis_strata'] is not None:
            adonis_strata = self.parameters.params['adonis_strata']
            if isinstance(adonis_strata, list):
              adonis_strata = ','.join(adonis_strata)
            args.extend(['--strata',
                         adonis_strata])

        elif method == 'pcoa':
          pcoa_distfun = self.parameters.params['pcoa_distfun']
          if pcoa_distfun is not None:
            if isinstance(pcoa_distfun, list):
              pcoa_distfun = ','.join(pcoa_distfun)
            args.extend(['--fun',
                         str(pcoa_distfun)])

        elif method == 'cca':
          if self.parameters.params['cca_categ'] is not None:
            cca_categ = self.parameters.params['cca_categ']
            if isinstance(cca_categ, list):
              cca_categ = ','.join(cca_categ)
            args.extend(['--column',
                         cca_categ])
          else:
            log['messages'].append({'warning':'No categorical data was given in CCA. Please provide the name(s) of column(s) in map that contain(s) categorical data to be used in CCA.'})
            log['status'] = 'skipped'
            self.log.update()
            return(0)

        elif method == 'heatmap' and self.parameters.params['secondary_dataset'] is not None:
          args.extend(['--secondary',
                       self.secondary_dataset.data_fp[0]])

        elif method == 'correlation_network':
          if self.parameters.params['correlation_network_fun'] is not None:
            correlation_network_fun = self.parameters.params['correlation_network_fun']
            if isinstance(correlation_network_fun, list):
              correlation_network_fun = ','.join(correlation_network_fun)
            args.extend(['--fun',
                         correlation_network_fun])
          if self.parameters.params['secondary_dataset'] is not None:
            args.extend(['--secondary',
                         self.secondary_dataset.data_fp[0]])

        elif method == 'similarity_network':
          append_to_map = True
          if self.parameters.params['similarity_network_fun1'] is not None:
            fun = self.parameters.params['similarity_network_fun1']
            if self.parameters.params['secondary_dataset'] is not None and self.parameters.params['similarity_network_fun2'] is not None:
              fun = fun+','+self.parameters.params['similarity_network_fun2']
            args.extend(['--fun', fun])
          if self.parameters.params['similarity_network_clust'] is not None:
            args.extend(['--clust',
                         self.parameters.params['similarity_network_clust']])
          if self.parameters.params['secondary_dataset'] is not None:
            args.extend(['--secondary',
                         self.secondary_dataset.data_fp[0]])

        if len(self.primary_dataset.data_fp) > 1:
          if len(self.primary_dataset.data_fp) != len(self.parameters.params['bin_levels']):
            Error(msg='Analysis cannot be performed at specified binning levels because corresponding data files were not found.',
                  to_rm=self.to_rm)

          log['levels'] = log.pop('messages')
          for i in range(0, len(self.parameters.params['bin_levels'])):
            log['levels'].append({'level':self.parameters.params['bin_levels'][i], 'status':'pending', 'messages':[]})

        for i in range(0, len(self.primary_dataset.data_fp)):
          l = log
          output_fp = output+'/'+method
          if len(self.primary_dataset.data_fp) > 1:
            l = [e for e in log['levels'] if e['level'] == self.parameters.params['bin_levels'][i]][0]
            output_fp = output_fp+'_level_'+self.parameters.params['bin_levels'][i]

          l['status'] = 'running'
          args_cp = copy(args)

          args_cp.extend(['-t',
                          self.primary_dataset.data_fp[i],
                          '-o',
                          output_fp])

          if self.parameters.params['model_type'] == 'basic':
            if isinstance(self.parameters.params['basic_model'], list):
              m = ','.join(self.parameters.params['basic_model'])
            else:
              m = self.parameters.params['basic_model']
            args_cp.extend(['--model',
                            m])
          else:
            if isinstance(self.parameters.params['advanced_model'], list):
              m = ','.join(self.parameters.params['advanced_model'])
            else:
              m = self.parameters.params['advanced_model']

            if isinstance(self.parameters.params['advanced_stats'], list):
              s = ','.join(self.parameters.params['advanced_stats'])
            else:
              s = self.parameters.params['advanced_stats']

            args_cp.extend(['--stats',
                            s,
                            '--model',
                            m])

          sub = Popen(args_cp, stdout=PIPE, stderr=PIPE)
          sub.wait()

          s = sub.stdout.read()
          #print s

          if s is not None and s != '':
            stdout.append(s)
          s = sub.stderr.read()
          if s is not None and s != '':
            stderr.append(s)

          if os.path.exists(tmp.name):
            with open(tmp.name, 'r') as t:
              l['messages'].extend(stdoutLog2json(t))
            os.remove(tmp.name)
          tmp.close()
          self.log.update()

          if append_to_map:
            if os.path.exists(output_fp+'.txt') and os.stat(output_fp+'.txt').st_size != 1:
              tmpmap = NamedTemporaryFile(delete=False, dir=self.tmpdir)
              with open(tmpmap.name, 'w') as new, open(self.map.fp) as m, open(output_fp+'.txt') as c:
                i = 0
                for line_m, line_c in zip(m, c):
                  to_add = line_c.rstrip().split('\t')
                  to_add.pop(0)
                  if i == 0:
                    while to_add in line_m.rstrip().split('\t'):
                      to_add = to_add+'_'+rand(3)
                    model_to_add = to_add
                  new.write('%s\t%s\n' % (line_m.rstrip(), '\t'.join(to_add)))
                  i = i+1
              move(tmpmap.name, self.map.fp)

              if self.parameters.params['model_type'] == 'basic':
                if not isinstance(self.parameters.params['basic_model'], list):
                  self.parameters.params['basic_model'] = [self.parameters.params['basic_model']]
                self.parameters.params['basic_model'].extend(model_to_add)
              else:
                if not isinstance(self.parameters.params['advanced_model'], list):
                  self.parameters.params['advanced_model'] = [self.parameters.params['advanced_model']]
                self.parameters.params['advanced_model'].extend(model_to_add)
                if not isinstance(self.parameters.params['advanced_stats'], list):
                  self.parameters.params['advanced_stats'] = [self.parameters.params['advanced_stats']]
                self.parameters.params['advanced_stats'].extend(['anova'])
            else:
              Warning(msg='In '+method+': output file not found ('+output_fp+'.txt'+').')

          if len([e for e in l['messages'] if 'error' in e.keys()]) > 0:
            l['status'] = 'failed'
            log['execution_time'] = str(datetime.now() - start_time)
            log['status'] = 'failed'
            self.log.update()
            Error(msg='See'+self.log.fp+'.', to_rm=self.to_rm) 
          else:
            l['status'] = 'completed'
            self.log.update()
        log['execution_time'] = str(datetime.now() - start_time)
        log['status'] = 'completed'
        self.log.update()

