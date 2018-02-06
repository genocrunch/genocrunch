#!/usr/bin/env python2.7
# -*- coding: utf-8 -*-
#analyse_count_table.py

import os, json, errno, copy, sys, inspect, shutil

# Import genocrunch library
__dir__ = os.path.dirname(__file__)
main_dir = '/'.join(__dir__.split('/')[0:len(__dir__.split('/'))-1])

genocrunchlib = main_dir+'/lib'
if genocrunchlib not in sys.path:
  sys.path.insert(0, genocrunchlib)

import genocrunchlib as gc

analysis = gc.Analysis(main_dir+'/etc/genocrunchlib.json')

try:
  analysis.run()
except:
  analysis.cleanup()
  print("Unexpected error:", sys.exc_info()[0])
  raise

exit()
