#!/usr/bin/env Rscript
#get_version.R
# Get version of packages installed
args <- commandArgs(trailingOnly=FALSE)
pkgs <- unlist(strsplit(args[6], ','))

output <- c(1:(length(pkgs)+1))
output[1] <- paste('{"name":"R","version":"',
                   R.version.string,
                   '"}',
                   sep='')
for (i in 1:length(pkgs)) {
  if (!require(pkgs[i], character.only=TRUE)) {
    version <- 'NA'
  } else {
    version <- packageVersion(pkgs[i])
  }
  output[i+1] <- paste('{"name":"',
                       pkgs[i],
                       '","version":"',
                       version,
                       '"}',
                       sep='')
}
cat(paste('[', paste(output, collapse=','), ']', sep=''))

rm(list=ls())
