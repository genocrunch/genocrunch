#!/usr/bin/env Rscript
#validate_format.R
# Generic script to validate dataset format

# Set environment
suppressMessages(library('optparse'))

methods <- c('validate_dataset', 'validate_map')

# Set options. Note: there is a small bug with '-g', do not use it for any option
option_list <- list(make_option(c('-t', '--table'),
                                type='character',
                                default=NULL,
                                help='Path to data table'),
                    make_option(c('-m', '--method'),
                                type='character',
                                default=NULL,
                                help=paste('Valid choices: ', paste(methods, collapse=', '), sep='')),
                    make_option('--map',
                                type='character',
                                default=NULL,
                                help='Path to mapping file'),
                    make_option('--category_column',
                                type='character',
                                default=NULL,
                                help='Name of the category column in dataset'))

opt <- parse_args(OptionParser(option_list=option_list))
msg <- NULL
if (opt$method == 'validate_dataset') {
  table <- read.table(file=opt$table, sep='\t', header=1, row.names=1)
  map <- read.table(file=opt$map, sep='\t', header=1)

  if (!is.null(opt$category_column) &&  opt$category_column != '') {
    if (! opt$category_column %in% names(table)) {
      msg <- append(msg, paste('"error":"', opt$category_column, ' not found in dataset headers"', sep=''))
    }
  }

  data.sample <- names(table[, names(table) != opt$category_column])
  intersect <- intersect(data.sample, map[, 1])
  if (length(intersect) < nrow(map)) {
    not.in.data <- as.vector(map[, 1][! map[, 1] %in% intersect])
    msg <- append(msg, paste('"error":"The following samples were found in map but not in dataset: ', paste(not.in.data, collapse=' ,'), '. This can happen if the wrong samples names column was selected in map or if samples names in map do not match samples names in dataset(s)."', sep=''))
  }

  if (length(data.sample) > nrow(map)) {
    not.in.map <- as.vector(data.sample[! data.sample %in% intersect])
    msg <- append(msg, paste('"comment":"The following samples were found in dataset but not in map: ', paste(not.in.map, collapse=' ,'), '. These samples will not be included in the analysis. Please make sure that this is what you expect."', sep=''))
  }

  n.missing <- length(table[table == ''])
  if (n.missing) {
    msg <- append(msg, '"warning":"Missing values were found (', n.missing, ' detected)."')
  }

} else if (opt$method == 'validate_map') {
  map <- read.table(file=opt$map, sep='\t', header=1)

  if (length(unique(map[, 1])) != nrow(map)) {
    msg <- append(msg, '"error":"Some sample names were found multiple times. Please fix the map."')
  }
}

if (is.null(msg)) {
  msg <- append(msg, '"description":"No issue detected."')
}
cat(paste(msg, collapse=','))

rm(list=ls())
