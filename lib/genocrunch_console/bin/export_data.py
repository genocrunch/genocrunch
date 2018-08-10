#!/usr/bin/env python2.7
# -*- coding: utf-8 -*-
#export_data.py

import os, argparse
from json import load, dump

def Error(f=__file__, msg='', to_rm=[]):

    print 'Error ['+ os.path.basename(f) +']: '+ msg
    if len(to_rm) > 0:
      for t in to_rm:
        rmtree(t)
    raise SystemExit(1)

class Export(object):
    """Export data"""

    def __init__(self, json_fp=''):
        """Set the parameters"""

        argument_parser = argparse.ArgumentParser()
        argument_parser._action_groups.pop()
        required_arguments = argument_parser.add_argument_group('required arguments')
        optional_arguments = argument_parser.add_argument_group('optional arguments')
        required_arguments.add_argument('--input',
                                        help='Path to input file.',
                                        nargs=1,
                                        type=str)
        required_arguments.add_argument('--input_format',
                                        help='Input format.',
                                        nargs=1,
                                        type=str)
        required_arguments.add_argument('--output',
                                        help='Path to output file.',
                                        nargs=1,
                                        type=str)
        optional_arguments.add_argument('--model',
                                        help='Model',
                                        nargs=1,
                                        type=str)
        optional_arguments.add_argument('--effect',
                                        help='Effect',
                                        nargs=1,
                                        type=str)
        optional_arguments.add_argument('--comparison',
                                        help='Comparison',
                                        nargs=1,
                                        type=str)

        self.params = argument_parser.parse_args().__dict__

    def fc2txt(self):
        """Export changes"""

        with open(self.params['input'][0], 'r') as f:
          fc = load(f)
        data = fc['data']
        if len(fc['data']) == 1:
          self.params['model'] = fc['data'].keys()
        if len(fc['data'][self.params['model'][0]]) == 1:
          self.params['effect'] = fc['data'][self.params['model'][0]].keys()
        if len(fc['data'][self.params['model'][0]][self.params['effect'][0]]) == 1:
          self.params['comparison'] = fc['data'][self.params['model'][0]][self.params['effect'][0]].keys()
        data = fc['data'][self.params['model'][0]][self.params['effect'][0]][self.params['comparison'][0]]

        header = data[0].keys()
        row_names = fc['names']
        with open(self.params['output'][0], 'w') as out:
          out.write('%s\t%s\n' % ('|'.join([self.params['model'][0], self.params['effect'][0], self.params['comparison'][0]]), '\t'.join(header)))
          i = 0
          for l in data:
            out.write('%s\t%s\n' % (row_names[i], '\t'.join([l[k] for k in header])))
            i = i+1

export = Export()
if export.params['input_format'] is not None and export.params['input_format'][0] == 'change':
  export.fc2txt()

exit()
