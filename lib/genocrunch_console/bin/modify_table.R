#!/usr/bin/env Rscript
#modify_table.R
# Generic script to modify a table

# Set environment
args <- commandArgs(trailingOnly=FALSE)
dir <- gsub('--file=', '', dirname(args[4]))
file <- gsub('--file=', '', args[4])
lib <- paste(dir, '/../lib', sep='')
source(file.path(lib, 'genocrunchlib.R'))
suppressMessages(library('optparse'))
options(scipen=999)
set.seed(2)

methods <- c('sorting', 'filtering', 'log2cpm', 'percent', 'VST', 'anova_adjustment', 'rarefaction', 'binning', 'transpose', 'div', 'none')

# Set options. Note: there is a small bug with '-g', do not use it for any option
option_list <- list(make_option(c('-t', '--table'),
                                type='character',
                                default=NULL,
                                help='Path to data file'),
                    make_option(c('-o', '--output'),
                                type='character',
                                default=paste(file, '_out', sep=''),
                                help='Path to output file'),
                    make_option(c('-m', '--method'),
                                type='character',
                                default=NULL,
                                help=paste('Modification type. Valid choices: ', paste(methods, collapse=', '), sep='')),
                    make_option(c('-v', '--verbose'),
                                type='logical',
                                default=TRUE,
                                help='Print a description?'),
                    make_option('--map',
                                type='character',
                                default=NULL,
                                help='Path to mapping file'),
                    make_option('--effect',
                                type='character',
                                default=NULL,
                                help='comma-delimited list of random effects to \
suppress. Elements must be names of columns in mapping file'),
                    make_option('--ignore',
                                type='character',
                                default='none',
                                help='Comma-delimited list of columns to ignore'),
                    make_option('--sample',
                                type='character',
                                default='max',
                                help='Sampling depth (sample size)'),
                    make_option('--nsampling',
                                type='numeric',
                                default=3,
                                help='Number of random sampling (without replacement) to perform'),
                    make_option('--level',
                                type='character',
                                default='NA',
                                help='Aggragation level'),
                    make_option('--fun',
                                type='character',
                                default='sum',
                                help='Function to use for aggregation'),
                    make_option('--column',
                                type='character',
                                default=NULL,
                                help='Column name'),
                    make_option('--abundance_threshold',
                                type='numeric',
                                default=0,
                                help='Abundance threshold'),
                    make_option('--abundance_threshold_type',
                                type='character',
                                default='percent',
                                help='Percent or absolute value? Valid choices: percent,int.'),
                    make_option('--presence_threshold',
                                type='numeric',
                                default=0,
                                help='Presence threshold'),
                    make_option('--presence_threshold_type',
                                type='character',
                                default='int',
                                help='Percent or absolute value? Valid choices: percent,int.'),
                    make_option('--vect',
                                type='character',
                                default=NULL,
                                help='Path to vector file'),
                    make_option('--log',
                                type='character',
                                default=NULL,
                                help='Path to log file'))

opt_parser <- OptionParser(option_list=option_list)
opt <- parse_args(opt_parser)
log_fp <- opt$log

# Set general inputs
table <- read.table(file=opt$table, sep='\t', header=1, row.names=1)
ignore <- as.vector(unlist(strsplit(opt$ignore, split=',')))
table.ignored <- as.data.frame(table[, names(table) %in% ignore])
names(table.ignored) <- names(table)[names(table) %in% ignore]
table <- table[, !(names(table) %in% ignore)]

if (! is.null(opt$map)) {
  map <- read.table(file=opt$map, sep='\t', header=1, row.names=1)
}

if (opt$method == 'none') {

  table.modified <- table

} else if (opt$method == 'sorting') {
#  column <- opt$column
#  if (is.null(column)) {
#    column <- 1
#  }
#  print(column)
  table.modified <- SortTable(table=table, map=map, verbose=opt$verbose)

} else if (opt$method == 'filtering') {

  table.modified <- FilterTable(table=table,
                                category=opt$column,
                                abundance_threshold=opt$abundance_threshold,
                                abundance_threshold_type=opt$abundance_threshold_type,
                                presence_threshold=opt$presence_threshold,
                                presence_threshold_type=opt$presence_threshold_type,
                                verbose=opt$verbose)

} else if (opt$method == 'VST') {

  table.modified <- ApplyVST(table=table, map=map, verbose=opt$verbose)

} else if (opt$method == 'log2cpm') {

  table.modified <- ApplyLog2Cpm(table=table, verbose=opt$verbose)

} else if (opt$method == 'log2') {

  table.modified <- ApplyLog2(table=table, verbose=opt$verbose)

} else if (opt$method == 'percent') {

  table.modified <- ApplyCount2Percent(table=table, verbose=opt$verbose)

} else if (opt$method == 'batch_effect_suppression') {

  table.modified <- SuppressBatchEffect(table=table, map=map, effect=opt$effect,
                                        fun=opt$fun, verbose=opt$verbose)

} else if (opt$method == 'rarefaction') {

  table.modified <- RarefyTable(table=table, sample=opt$sample, nsampling=opt$nsampling, verbose=opt$verbose)

} else if (opt$method == 'binning') {

  table.modified <- BinTableByCategory(table, opt$column, opt$fun, opt$level, opt$verbose)

} else if (opt$method == 'transpose') {

  table.modified <- Transpose(table=table, verbose=opt$verbose)

} else if (opt$method == 'div') {

  vect <- read.table(file=opt$vect, sep='\t', header=1, row.names=1)
  table.modified <- DivTable(table, vect, verbose=opt$verbose)

}

# Append optional ignored column(s) if any
if (ncol(as.matrix(table.ignored)) != 0) {
  table.modified <- data.frame(table.modified, table.ignored)
}

# Write modified table to output location
WriteTable(table.modified, opt$output, name='', sep='\t')
PrintMsg(paste('"output":"', opt$output, '"', sep=''), opt$verbose)

rm(list=ls())
