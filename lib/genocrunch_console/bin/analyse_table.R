#!/usr/bin/env Rscript
#analyse_table.R
# Generic script to analyse a table

# Set environment
libname <- 'genocrunchlib'

args <- commandArgs(trailingOnly=FALSE)
dir <- gsub('--file=', '', dirname(args[4]))
file <- gsub('--file=', '', args[4])
lib <- normalizePath(path=paste(dir,
                                '/../lib/',
                                libname,
                                '.R',
                                sep=''),
                     mustWork=TRUE)


holynetlib <- normalizePath(path=paste(dir,'/../lib/holynetlib.R', sep=''), mustWork=FALSE)
friedmanlib <- normalizePath(path=paste(dir,'/../lib/friedman_test_with_post_hoc.R', sep=''), mustWork=FALSE)
source(lib)
source(friedmanlib)
suppressMessages(library('optparse'))
suppressMessages(library('rjson'))
options(scipen=999)
set.seed(2)

# Set whether output can be graphical or not
graphical <- list(clustering=         TRUE,
                  proportions=        TRUE,
                  diversity=          TRUE,
                  adonis=             TRUE,
                  pca=                TRUE,
                  ca=                 TRUE,
                  pcoa=               TRUE,
                  cca=                TRUE,
                  change=             TRUE,
                  heatmap=            TRUE,
                  correlation_network=FALSE,
                  similarity_network= FALSE)

# Set options. Note: there is a small bug with '-g', do not use it
option_list <- list(make_option(c('-t', '--table'),  # General options
                                type='character',
                                default=NULL,
                                help='Path to data table'),
                    make_option(c('-o', '--output'),
                                type='character',
                                default=paste(file, '_out', sep=''),
                                help='Path to output file'),
                    make_option(c('-v', '--verbose'),
                                type='character',
                                default='TRUE',
                                help='Print a description?'),
                    make_option('--graphical',
                                type='logical',
                                default=TRUE,
                                help='Generate graphics?'),
                    make_option('--json',
                                type='character',
                         default=ReadJson(file=normalizePath(paste(dir,
                                              '/../etc/',
                                              libname,
                                              '.json',
                                              sep=''),
                                            mustWork=TRUE),
                                          rel=FALSE),
                                help='A json string of characters with function-specific information'),
                    make_option(c('-m', '--method'),
                                type='character',
                                default=NULL,
                                help=paste('Analysis method. Valid choices: ',
                                     paste(names(graphical), collapse=', '),
                                     sep='')),
                    make_option('--category',
                                type='character',
                                default='taxonomy',
                                help='Name of the category column in table'),
                    make_option('--width',
                                type='numeric',
                                default=5,
                                help='Figure width in cm'),
                    make_option('--height',
                                type='numeric',
                                default=5,
                                help='Figure height in cm'),
                    make_option('--fun',
                                type='character',
                                default=NULL,
                                help='Function to use (generic)'),
                    make_option('--map',
                                type='character',
                                default=NULL,
                                help='Path to mapping file'),
                    make_option('--stats',
                                type='character',
                                default='anova',
                                help='Statistycal test to use.'),
                    make_option('--model',
                                type='character',
                                default=NULL,
                                help='An R formula representing the model for stats. Terms must refer to names(map). Multiple comma-separated formulae are accepted.'),
                    make_option('--adonis_model',
                                type='character',
                                default=NULL,
                                help='An R formula representing the model for adonis. Terms must refer to names(map). Multiple comma-separated formulae are accepted.'),
                    make_option('--strata',
                                type='character',
                                default=NULL,
                                help='Strata parameter for adonis. IF multiple models are specified, then multiple comma-separated strata are accepted.'),
                    make_option('--secondary',
                                type='character',
                                default=NULL,
                                help='Path to secondary data table'),
                    make_option('--nrar',
                                type='numeric',
                                default=50,
                                help='Number of rarefaction to perform'),
                    make_option('--clust',
                                type='character',
                                default="walktrap",
                                help='Graph-based clustering algorithm'),
                    make_option('--column',
                                type='character',
                                default=NULL,
                                help='Name of a column'),
                    make_option('--compare_diversity',
                                type='logical',
                                default=FALSE,
                                help='Compare diversity between groups?'),
                    make_option('--log',
                                type='character',
                                default=NULL,
                                help='Path to log file'))

opt_parser <- OptionParser(option_list=option_list)
opt <- parse_args(opt_parser)
log_fp <- opt$log

# Convert the library parameters from json string to list
json <- fromJSON(json_str=opt$json)

# Set general inputs
table <- read.table(file=opt$table, sep='\t', header=1, row.names=1, quote="")

if (opt$category %in% names(table)) {
  if (length(unique(unlist(table[, opt$category]))) == nrow(table)) {
    row.names(table) <- table[, opt$category]
  } else {
    row.names(table) <- paste(table[, opt$category], '(', row.names(table) ,')', sep='')
  }
  table <- table[, names(table) != opt$category]
}

if (!is.null(opt$map)) {
  map <- read.table(file=opt$map, sep='\t', header=1, row.names=1, quote="")
} else {
  map <- NULL
}

if (!is.null(opt$stats) && opt$stats != '') {
  stats <- strsplit(opt$stats, ',')[[1]]
} else {
  stats <- NULL
}

if (!is.null(opt$model) && opt$model != '') {
  model <- strsplit(opt$model, ',')[[1]]
} else {
  model <- NULL
}

if (!is.null(opt$fun)) {
  fun <- unlist(strsplit(opt$fun, ','))
} else {
  fun <- NULL
}

if (!is.null(opt$secondary)) {
  secondary.data <- read.table(file=opt$secondary, sep='\t', header=1, row.names=1, quote="")
} else {
  secondary.data <- NULL
}

# Set graphical output
if (graphical[[opt$method]] == TRUE && opt$graphical == TRUE) {
  fig.fp <- paste(opt$output, '.pdf', sep='')
  pdf(file=fig.fp, width=opt$width, height=opt$height)
  par(mar = c(1, 1, 1, 1), xpd=TRUE)
}

# Call the analysis function
###################
# Analysis function output should be one of the following element or a list
# containing one or more of the following elements:
#  'txt'   A matrix or data-frame to be written in a tab-delimited file
#  'json'  A json string to be written in a json file
#  'csv'   A matrix or data-frame to be written in a comma-delimited file
###################
data <- list()
if (opt$method == 'clustering') {

  data[['txt']] <- PerformClustering(table=table,
                                     fun=fun,
                                     json=json,
                                     verbose=opt$verbose,
                                     graphical=opt$graphical)
  if (!is.null(data[['txt']])) {
    names(data[['txt']]) <- basename(opt$output)
  }
} else if (opt$method == 'proportions') {
  data <- AnalyseProportions(table=table,
                                      verbose=opt$verbose,
                                      graphical=opt$graphical)

} else if (opt$method == 'diversity') {
  data <- AnalyseDiversity(table=table, map=map, fun=fun,
                                     nrar=opt$nrar,
                                     compare_diversity=opt$compare_diversity,
                                     stats=stats,
                                     model=model,
                                     json=json, verbose=opt$verbose,
                                     graphical=opt$graphical)

} else if (opt$method == 'adonis') {
  if (!is.null(opt$adonis_model) && opt$adonis_model != '') {
    adonis_model <- unlist(strsplit(opt$adonis_model, ','))
  } else {
    adonis_model <- model
  }
  if (!is.null(opt$strata) && opt$strata != '') {
    strata <- unlist(strsplit(opt$strata, ','))
  } else {
    strata <- NULL
  }
  data[['json']] <- PerformAdonis(table=table, map=map, fun=fun,
                                  model=adonis_model, strata=strata,
                                  json=json, verbose=opt$verbose,
                                  graphical=opt$graphical)

} else if (opt$method == 'pca') {

  data <- PerformPCA(table=table, map=map,
                               verbose=opt$verbose,
                               graphical=opt$graphical)

} else if (opt$method == 'ca') {

  data[['json']] <- PerformCA(table=table, map=map,
                              verbose=opt$verbose,
                              graphical=opt$graphical)

} else if (opt$method == 'pcoa') {

  data <- PerformPCoA(table=table, map=map,
                                fun=fun, json=json, verbose=opt$verbose,
                                graphical=opt$graphical)

} else if (opt$method == 'cca') {

  data[['json']] <- PerformCCA(table=table, map=map, column=opt$column,
                               verbose=opt$verbose,
                               graphical=opt$graphical)

} else if (opt$method == 'change') {

  data <- AnalyseChange(table=table, map=map,
                                  stats=stats,
                                  model=model, json=json,
                                  verbose=opt$verbose, graphical=opt$graphical)

} else if (opt$method == 'heatmap') {

  data <- BuildHeatMap(table=table, map=map,
                       stats=stats,
                       model=model, secondary=secondary.data, fun=fun, json=json,
                       verbose=opt$verbose, graphical=opt$graphical)

} else if (opt$method == 'correlation_network') {

  data <- BuildCorrelationNetwork(table=table, map=map,
                       stats=stats,
                       model=model,
                       json=json, secondary=secondary.data, fun=fun,
                       verbose=opt$verbose)

} else if (opt$method == 'similarity_network') {
  if (!is.null(secondary.data)) {
    tables <- list(table, secondary.data)
    clust.names <- c('primary_dataset', 'secondary_dataset', 'snf')
  } else {
    tables <- list(table)
    clust.names <- 'primary_dataset'
  }
  data <- BuildSimilarityNetwork(table=tables, map=map,
                                 clust=opt$clust,
                                 clust.names=paste(basename(opt$output),
                                                   clust.names, sep='_'),
                                 funs=fun, json=json,
                                 verbose=opt$verbose, lib=holynetlib)
}

# Write data
if (graphical[[opt$method]] == TRUE && opt$graphical == TRUE) {
  PrintMsg(paste('"output":"', fig.fp, '"', sep=''), opt$verbose)
  graphics.off()
}

f.type <- names(data)
for (i in 1:length(f.type)) {

  if (!is.null(data[[f.type[i]]])) {
    output.fp <- paste(opt$output, '.', f.type[i], sep='')  
    PrintMsg(paste('"output":"', output.fp, '"', sep=''), opt$verbose)

    if (f.type[i] == 'json') {
      write(x=data[[f.type[i]]], file=output.fp, append=FALSE)
    } else if (f.type[i] == 'txt') {
      WriteTable(data[[f.type[i]]], output.fp, name='', sep='\t')
    } else if (f.type[i] == 'csv') {
      WriteTable(data[[f.type[i]]], output.fp, name='name', sep=',')
    }
  }
}

rm(list=ls())
