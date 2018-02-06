#!/usr/bin/env python2.7
# -*- coding: utf-8 -*-
#get_version.py

import os
from subprocess import Popen, PIPE
from json import load, dump
from datetime import datetime

__dir__ = os.path.dirname(__file__)

pkg_list = []

# Get packages hard-coded in R scripts
sub = Popen([__dir__+'/get_version.sh'], stdout=PIPE, stderr=PIPE)
sub.wait()
pkg_list.extend([e for e in sub.stdout.read().split('\n') if e not in [None, '', ' ']])

# Get packages passed in etc json
json_fp = __dir__+'/../etc/genocrunchlib.json'
if os.path.exists(json_fp):
  data = load(open(json_fp))

for key, val in data['choices'].iteritems():
  pkg = [e['pkg'] for e in val if 'pkg' in e.keys() and e['pkg'] not in [None, '', ' ']]
  if len(pkg) > 0:
    pkg_list.extend(pkg)
pkg_list = list(set(pkg_list))

# Get version installed
sub = Popen([__dir__+'/get_version.R', ','.join(pkg_list)], stdout=PIPE, stderr=PIPE)
sub.wait()
versions = sub.stdout.read()

with open('version_'+str(datetime.now()).replace(' ', '_')+'.json', 'w') as f:
  f.write(versions)

exit()
