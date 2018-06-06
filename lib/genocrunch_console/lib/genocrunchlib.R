#genocrunchlib.R

################
# Print message in a formatted way so it can be decomposed into categories of
# logs. Can also be used to issue errors
# Args:
#  (1) label    (character) A label for the message (ex: title, log, warning...)
#  (2) text     (character) Message to print
#  (3) verbose  (character) A statement: 'TRUE' or same value as 'label':print
#               to stdout; 'FALSE':don't print;
# Prints to stdout:
#  Tab-separated: Path to executed script, date and time, 'label' and 'text'
################
log_fp <- NULL
PrintMsg <- function(text='default message', verbose=TRUE, stop=FALSE, log=log_fp) {

  if (!is.null(log)) {
    f <- file(log, open="at")
    sink(file=f, append=TRUE)
    sink(type="message")
  }
  if (as.logical(verbose) == TRUE) {
    cat(text)
  }
  if (!is.null(log)) {
    sink()
    sink(type="message")
    close(f)
  }
  if (as.logical(stop) == TRUE) {
    stop(text)
  }
}

################
# Write a table to an output location, with the option of having indented
# columns name if 'name'=''.
# Args:
#  (1) table      Table object
#  (2) output.fp  Path to the output file
#  (3) name       Name of first column
#  (4) sep        Separator character
#  (5) na         na
#  (6) dec        dec
#  (7) quote      quote
# Outputs:
#  Writes 'table' to 'output.fp', starting first line with an indentation ('\t')
################
WriteTable <- function(table=NULL, output.fp='', name='name', sep='\t', na='',
                       dec='.', quote=FALSE) {
  write.table(t(c(name, names(table))), file=output.fp, append=FALSE,
              row.names=FALSE, col.names=FALSE, sep=sep, na=na, dec=dec,
              quote=quote)
  write.table(table, file=output.fp, append=TRUE, row.names=TRUE,
              col.names=FALSE, sep=sep, na=na, dec=dec, quote=quote)
}

################
# Reads the "Rfunctions" section of a json file as a json string
# Args:
#  (1) json  Path to the json file
# Outputs:
#  A json string as found in the "Rfunctions" section of the json file
################
ReadJson <- function(file='/../etc/genocrunchlib.json', rel=TRUE) {
  suppressMessages(library('rjson'))

  if (rel) {
    # Consider file as a relative path with respect to this library
    args <- commandArgs(trailingOnly=FALSE)
    dir <- dirname(sub('--file=', '', args[grep('--file=', args)]))

    file <- normalizePath(paste(dir,
                                file,
                                sep=''),
                          mustWork=TRUE)
  }

  if (!file.exists(file)) {
    PrintMsg(paste('"error":"File not found: ',
                   file,
                   '."',
                   sep=''),
                   verbose=TRUE, stop=TRUE) 
  }

  json_str <- fromJSON(file=file)

  return (toJSON(json_str$choices))
}

################################################################################
################################################################################
# MANIPULATION #################################################################
# MANIPULATION #################################################################
# MANIPULATION #################################################################
# MANIPULATION #################################################################
################################################################################
################################################################################

################
# Convert a data frame of factors to a numeric data frame. Unlike data.matrix,
# it will force characters to numeric.
# Args:
#  (1) x  A data frame
# Returns:
#  A numeric version of 'x'
################
ForceNumericDataFrame <- function(x) {
  x <- as.matrix(x)
  for (i in 1:ncol(x)) {
    x[, i] <- as.numeric(as.vector(unlist(x[, i])))
  }
  return (as.data.frame(x))
}

################
# Convert values of a numeric vector to percents of its sum
# Args:
#  (1) x  A numeric vector
# Returns:
#  A percent version of 'x'
################
Numeric2Percent <- function(x){
  return (100*x/sum(x))
}

################
# Scale a numeric vector on a range of values
# Args:
#  (1) x      A numeric vector
#  (2) range  A numeric vector containing 2 elements
#  (3) force  A logical indicating wheter infinite values should be forced into
#             'range'
# Returns:
#  A scaled version of 'x', within 'range'
################
RangeScale <- function(x=NULL, range=c(0, 1), force=TRUE) {
  scaled <- range[1]*(1-((x-min(x, na.rm=TRUE))/(max(x, na.rm=TRUE)-min(x,
            na.rm=TRUE))))+range[2]*((x-min(x, na.rm=TRUE))/(max(x,
            na.rm=TRUE)-min(x, na.rm=TRUE)))
  if (force == TRUE) {
    scaled[scaled == -Inf] <- min(range)
    scaled[scaled == Inf] <- max(range)
  }
  return (scaled)
}

################
# Scale by standard deviation and center on mean
# Args:
#  (1) x      A numeric vector
# Returns:
#  A scaled version of 'x'
################
cScale <- function(x=NULL) {
  sd <- sd(x, na.rm=TRUE)
  mean <- mean(x, na.rm = TRUE)
  if (is.na(sd)) {
    sd <- 1
  } else if (sd == 0) {
    sd <- 1
  }
  if (is.na(mean)) {
    mean <- 0
  }
  return (x/sd-mean)
}

################################################################################
################################################################################
# JSON HANDELING ###############################################################
# JSON HANDELING ###############################################################
# JSON HANDELING ###############################################################
# JSON HANDELING ###############################################################
################################################################################
################################################################################

################
# Build a json string to store figure data
# Args:
#  (1) data       (data-frame)
#  (2) xmetadata  (data-frame) With nrow=ncol(data)
# Returns:
#  A json string
################
Dataframe2DataJson <- function(data=NULL, xmetadata=NULL){

  # Rules:
  #  colname(data) -> [{'name'}]
  #  rowname(data) and data -> [{'data':['rowname(data)':'data']}]
  #  xmetadata -> [{'rowname(xmetadata)'}]

  json <- c(1:ncol(data))
  for (i in 1:ncol(data)) {
    xmetadata.json <- NULL
    if (!is.null(xmetadata)) {
      xmetadata.json <- c(1:ncol(xmetadata))
      for (j in 1:ncol(xmetadata)) {
        xmetadata.json[j] <- paste('"',
                                   names(xmetadata)[j],
                                   '":"',
                                   xmetadata[i, j],
                                   '"',
                                   sep='')
      }
      xmetadata.json <- paste(xmetadata.json, collapse=',')
    }

    data.json.el <- c(1:nrow(data))
    for (j in 1:nrow(data)) {
      data.json.el[j] <- paste('"',
                               row.names(data)[j],
                               '":"',
                               data[j, i],
                               '"',
                               sep='')
    }
    data.json <- paste('{', paste(data.json.el, collapse=','), '}',sep='')

    json[i] <- paste('{',
                     paste(c(paste('"name":"',
                                   names(data)[i],
                                   '"',
                                   sep=''),
                             xmetadata.json,
                             paste('"data":',
                                   data.json,
                                   sep='')),
                           collapse=','),
                     '}',
                     sep='')
  }

  return (paste('[', paste(json, collapse=','), ']', sep=''))
}


################
# Build a json string to store diversity values
# Args:
#  (1) diversity       (list)
#  (2) p.value  (list)
#  (3) map      (matrix)
# Returns:
#  A json string
################
diversity2json <- function(diversity=NULL, p.value=NULL, map=NULL){
    rar <- row.names(diversity)
    nsample <- ncol(diversity)
    sample <- c(1:nsample)
    for (j in 1:nsample) {
      ndata <- nrow(diversity)
      data <- c(1:ndata)
      for (k in 1:ndata) {
        data[k] <- paste('"',
                       rar[k],
                       '":',
                       diversity[k, j],
                       sep='')
      }
      metadata <- c(1:ncol(map))
      for (k in 1:ncol(map)) {
        metadata[k] <- paste('"',
                            names(map[k]),
                            '":"',
                            map[j, k],
                            '"',
                            sep='')
      }
      sample[j] <- paste('{"name":"',
                         row.names(map)[j],
                         '",',
                         paste(metadata, collapse=','),
                         ',"data":{',
                         paste(data, collapse=','),
                         '}}',
                         sep='')
    }
    if (!is.null(p.value)) {
      stat <- c(1:length(p.value))
      for (j in 1:length(p.value)) {
        s <- c(1:length(p.value[[j]]))
        for (k in 1:length(p.value[[j]])) {
          s[k] <- paste('{"name":"',
                         names(p.value[[j]])[k],
                         '", "p-value":"',
                         p.value[[j]][1, k],
                         '"}',
                         sep='')
        }
        stat[j] <- paste(s, collapse=',')
      }
      json <- paste('{"data":[',
                    paste(sample, collapse=','),
                    '],"stat":[',
                    paste(stat, collapse=','),
                    ']}',
                    sep='')
    } else {
      json <- paste('{"data":[',
                    paste(sample, collapse=','),
                    ']}',
                    sep='')
    }
  return (json)
}


################
# Build a json tree from dendrogram
# Args:
#  (1) dendrogram  (list) A dendrogram (nested lists)
# Returns:
#  A json string
################
dendrogram2json <- function(dendrogram=NULL, json=NULL, it=0) {
  start <- FALSE
  if (is.null(json)) {
    start <- TRUE
    json <- paste('{"name":"node',
                  it,
                  '", "children":[',
                  sep='')
  }

  json.vect <- c(1:length(dendrogram))
  for (i in 1:length(dendrogram)) {
    if (length(dendrogram[[i]]) > 1) {
      it <- it+1
      json.vect[i] <- paste('{"name":"node',
                            it,
                            '", "children":[',
                            sep='')
      dendrogram2json.out <- dendrogram2json(dendrogram[[i]], json.vect[i], it)

      json.vect[i] <- dendrogram2json.out[[1]]
      it <- dendrogram2json.out[[2]]
      json.vect[i] <- paste(json.vect[i], ']}', sep='')
    } else {
      json.vect[i] <- paste('{"name":"',
                            dendrogram[[i]],
                            '"}',
                            sep='')

    }
  }

  if (start) {
    json <- paste(json, paste(json.vect, collapse=','), ']}', sep='')
  } else {
    json <- paste(json, paste(json.vect, collapse=','), sep='')
  }

  out <- list()
  out[1] <- json
  out[2] <- it
  return (out)
}

################
# Build a json network from similarity matrix
# Args:
#  (1) mat  list of numeric matrix
# Returns:
#  A json string
################
buildFusionNetworkJson <- function(mat=NULL, map=NULL){
  names <- colnames(mat[[1]])
  ncol <- ncol(mat[[1]])
  if (!is.null(map)) {
    ncol.map <- ncol(map)
  }
  nodes <- c(1:ncol)
  for (i in 1:ncol){
    if (!is.null(map)) {
      map.row <- c(1:ncol.map)
      for (j in 1:ncol.map) {
        map.row[j] <- paste('"',
                            names(map)[j],
                            '":"',
                            map[i, j],
                            '"',
                            sep='')
      }
    } else {
      map.row <- '"none":"none"'
    }
    nodes[i] <- paste('{"id":',
                      i-1,
                      ',"name":"',
                      names[i],
                      '",',
                      paste(map.row, collapse=','),
                      '}',
                      sep='')
  }
  links <- c(1:(ncol*(ncol/2-1)))
  k <- 1
  for (i in 1:(ncol-1)) {
    for (j in (i+1):ncol) {
      weights <- c(1:length(mat))
      for (l in 1:length(mat)) {
        weights[l] <- mat[[l]][i,j] 
      } 
      links[k] <- paste('{"source":',
                        i-1,
                        ',"target":',
                        j-1,
                        ',"weight":[',
                        paste(weights,collapse = ","),
                        ']}',
                        sep='')
      k <- k+1
    }
  }
  return(paste('{"nodes":[', paste(nodes, collapse = ","),'],"links":[', paste(links, collapse = ","), ']}', sep=''))
}

################################################################################
################################################################################
# MODIFICATION #################################################################
# MODIFICATION #################################################################
# MODIFICATION #################################################################
# MODIFICATION #################################################################
################################################################################
################################################################################

################
# Sort a data-frame columns according to a column of another
# Args:
#  (1) table   (matrix-like object) Table to be sorted
#  (2) map     (matrix-like object) Map to extract the sorting column from
#  (3) column  (numeric) Index of the column in map to use for sorting
#  (4) verbose (bool) Print messages? see PrintMsg() options
# Returns:
#  A sorted version of table
# Print to stdout:
# A description
################
SortTable <- function(table=NULL, map=NULL, verbose=TRUE) {
#  print(row.names(map))
#  print(map)
#  print(map[, column])
  PrintMsg('"description":"The table columns were sorted according to the map."', verbose)
  return(as.data.frame(table[, as.vector(row.names(map))]))
}

################
# Transpose a data frame (or a matrix-like object)
# Args:
#  (1) x  (matrix-like object)
# Returns:
#  A transposed version of 'x' (numeric dataframe)
################
Transpose <- function(x=NULL) {
  if (is.data.frame(x)) {
    names <- names(x)
    row.names <- row.names(x)
    x <- as.data.frame(t(x))
    names(x) <- row.names
    row.names(x) <- names
  } else {
    x <- t(x)
  }
  return (x)
}

################
# Filter numeric table (with category-specific options for OTU-type tables) 
# Args:
#  (1) table                (numeric dataframe) Count table
#  (2) category             (character) Name of the (optional) category column
#  (3) abundance_threshold  (numeric) Min % abundance per column [0,100]
#  (4) presence_threshold   (numeric) Min % presence per row [0,100]
#  (5) rm_unassigned        (logical) Remove unassigned category ?
#  (6) verbose              (character) Print messages? see PrintMsg() options
# Returns:
#  An filtered version of 'table' (numeric dataframe)
# Prints to stdout:
#  A description of the function
################
FilterTable <- function(table=NULL, category='taxonomy',
                        abundance_threshold=0.03,
                        abundance_threshold_type='percent',
                        presence_threshold=1,
                        presence_threshold_type='int',
                        verbose=TRUE) {

  nrow.init <- nrow(table)

  # First filter based on minimal abundance
  msg <- paste('"description":"Removed rows not exceeding ', abundance_threshold, sep='')
  filter <- table[, names(table) != category]
  minmax.a <- paste(min(filter), max(filter), sep='-')
  if (abundance_threshold_type == 'percent') {
    filter <- as.data.frame(apply(filter, 2, Numeric2Percent))
    msg <- paste(msg, '%', sep='')
    minmax.a <- paste(min(filter), '-', max(filter), '%', sep='')
  }
  max.abundance <- apply(filter, 1, max)
  table.filtered <- table[max.abundance >= abundance_threshold, ]
  nrow.filtered.a <- nrow(table.filtered)
  msg <- paste(msg,
               ' in at least one column: ',
               nrow.init-nrow.filtered.a,
               ' rows were removed out of ',
               nrow.init,
               '. Then, removed rows with presence (number of values not equal to zero) lower than ',
               presence_threshold,
               sep='')

  # Then filter based on minimal presence
  filter <- table.filtered[, names(table.filtered) != category]

  presence <- rowSums(filter != 0)
  minmax.p <- paste(min(presence), max(presence), sep='-')
  if (presence_threshold_type == 'percent') {
    presence <- Numeric2Percent(presence)
    msg <- paste(msg, '%', sep='')
    minmax.p <- paste(min(presence), '-', max(presence), '%', sep='')
  }
  table.filtered <- table.filtered[presence >= presence_threshold, ]
  nrow.filtered.p <- nrow(table.filtered)

  nstop <- nrow(table.filtered)
  ab.min <- round(min(filter), digits=4)
  ab.max <- round(max.abundance, digits=4)
  msg <- paste(msg,
               ': ',
               nrow.filtered.a-nrow.filtered.p,
               ' rows were removed out of ',
               nrow.filtered.a,
               ' (final number of rows = ',
               nrow.filtered.p,
               '). Min-max abundance found was ',
               minmax.a,
               '. Min-max presence found was ',
               minmax.p,
               '."',
               sep='')

  PrintMsg(msg, verbose)

  if (nrow.filtered.p == 0) {
    PrintMsg(paste('"error":"All the rows were filtered out. Please chose an abundance threshold within ', minmax.a, ' and a presence threshold within ', minmax.p, '."', sep=''), verbose, TRUE)
  }

  return (table.filtered)
}

################
# Bin numeric table by category
# Args:
#  (1) table     (numeric dataframe) Count table
#  (2) aggr.col  (character) Name of the column in 'table' to consider for data
#                aggregation
#  (3) fun       (character) Function to use for data aggregation. Valid
#                choices: 'mean', 'sum'
#  (4) verbose   (character) Print messages? see PrintMsg() options
# Returns:
#  An aggregated version of 'table' (numeric dataframe)
# Prints to stdout:
#  A description of the function
################
BinTableByCategory <- function(table=NULL, category_col='taxonomy', fun='sum',
                               level='NA', verbose=TRUE, vstyle=1) {

  if ((category_col == '') || !(category_col %in% names(table)) ) {
    category_col <- "row names"
    category <- row.names(table)
  } else {
    category <- paste(table[, names(table) == category_col],
                      '; (',
                      row.names(table),
                      ')',
                      sep='')
    table <- table[, names(table) != category_col]
  }
  category <- strsplit(category, ';')


  if (vstyle == 1) {
    PrintMsg(paste('"description":"Observations were binned by categories (category column:',
                   category_col,
                   ', function:',
                   fun,
                   ', level:',
                   level,
                   ')."',
                   sep=''), verbose)
  } else if (vstyle == 2) {
    PrintMsg(paste('"description":"Observations were binned by categories (category column:',
                 category_col,
                 ', function:',
                 fun,
                 '):"',
                 sep=''), verbose)
  }
  if (vstyle > 1) {
    PrintMsg(paste('"description-item":"Category level ',
                 level,
                 '"',
                 sep=''), verbose)
  }






  for (i in 1:length(category)) {
    category[[i]] <- gsub('^ *.__ *$', '', category[[i]])
    category[[i]] <- gsub('^ *', '', category[[i]])
    category[[i]] <- gsub(' *$', '', category[[i]])
    category[[i]] <- category[[i]][! category[[i]] %in% c('', ' ')]
    if (length(category[[i]]) >= level) {
      category[[i]] <- paste(category[[i]][1:level], collapse='; ')
    } else {
      category[[i]] <- paste(category[[i]], collapse='; ')
    }
  }
  category <- list(unlist(category))
  name <- 'category'
  while (name %in% names(table)) {
    name <- paste(name,paste(sample(c(0:9, letters, LETTERS), 3), collapse=''),sep='_')
  }
  names(category) <- name

  table.binned <- aggregate(table,
                              by=category, FUN=fun)

  row.names(table.binned) <- table.binned[, name]
  table.binned <- table.binned[, names(table.binned) != name]

  return(table.binned)
}

################
# Divide a data frame (or a matrix-like object) by a vector
# Args:
#  (1) table    (numeric dataframe) Count table
#  (2) vect     (vector) Vector to divide 'table'
#  (3) verbose  (character) Print messages? see PrintMsg() options
# Returns:
#  A divided (per row) version of 'table' (numeric dataframe)
# Prints to stdout:
#  A description of the function
################
DivTable <- function(table=NULL, vect=NULL, verbose='TRUE') {
  PrintMsg('log', 'Divide tables rows by a vector.', verbose=verbose)

  return (as.matrix(table) / unlist(vect))
}

################
# Transform to log2 count per milion
# Args:
#  (1) table    (numeric dataframe) Count table
#  (2) verbose  (character) Print messages? see PrintMsg() options
# Returns:
#  A transformed version of 'table' (numeric dataframe)
# Prints to stdout:
#  A description of the function
################
ApplyLog2Cpm <- function(table=NULL, verbose='TRUE') {
  if (length(table[table < 0]) > 0) {
    PrintMsg('"error":"The log2cpm transformation was not applied because negative values were detected."',
             verbose, TRUE)
    return ()
  }
  if (length(table[table%%1 > 0]) > 0) {
    PrintMsg('"warning":"Non-integer values were detected."', verbose)
    table <- round(table, digits=0)
  }

  PrintMsg('"description":"Values were converted into per-million per column and a log-transformation was applied (log2(x+1))."',
           verbose)

  transformed.table <- as.data.frame(log2(1+(apply(as.matrix(table),
                                                   2,
                                                   Numeric2Percent))*10000))
  names(transformed.table) <- names(table)
  row.names(transformed.table) <- row.names(table)

  return (transformed.table)
}

################
# Transform to log2
# Args:
#  (1) table    (numeric dataframe) Count table
#  (2) verbose  (character) Print messages? see PrintMsg() options
# Returns:
#  A transformed version of 'table' (numeric dataframe)
# Prints to stdout:
#  A description of the function
################
ApplyLog2 <- function(table=NULL, verbose=TRUE) {
  if (length(table[table < 0]) > 0) {
    PrintMsg('"error":"log2(x+1) was not applied because negative values were detected."',
             verbose, TRUE)
    return ()
  }
  PrintMsg('"description":"A log-transformation was applied (log2(x+1))."',
           verbose)

  transformed.table <- as.data.frame(log2(1+(as.matrix(table))))
  names(transformed.table) <- names(table)
  row.names(transformed.table) <- row.names(table)

  return (transformed.table)
}

################
# Transform to percent (per column)
# Args:
#  (1) table    (numeric dataframe) Count table
#  (2) verbose    (character) Print messages? see PrintMsg() options
# Returns:
#  A transformed version of 'table' (numeric dataframe)
# Prints to stdout:
#  A description of the function
################
ApplyCount2Percent <- function(table, verbose=TRUE) {
  PrintMsg('"description":"Values were converted into percentages per column."', verbose=verbose)
  transformed.table <- as.data.frame(apply(as.matrix(table), 2, Numeric2Percent))
  names(transformed.table) <- names(table)
  row.names(transformed.table) <- row.names(table)
  return (transformed.table)
}

################
# Apply rarefaction
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) sample     (positive integer or 'max') Sampling depth
#  (3) nsampling  (positive integer) Number of repeated sampling to performe
#  (4) verbose    (character) Print messages? see PrintMsg() options
# Returns:
#  A rarefied version of 'table' (a numeric dataframe)
# Prints to stdout:
#  A description of the function
################
RarefyTable <- function(table=NULL, sample='max', nsampling=1, verbose=TRUE) {
  suppressMessages(library('vegan'))

  # Round counts if not integers
  if (length(table[table < 0]) > 0) {
    PrintMsg('"error":"Rarefaction is not applicable because negative values were detected."', verbose, TRUE)
    return ()
  }
  if (length(table[table%%1 > 0]) > 0) {
    PrintMsg('"warning":"Non-integer values were detected. In order to permit rarefaction, these values were rounded to the nearest integer."', verbose)
    table <- round(table, digits=0)
  }

  # Define/check rarefaction depth
  min.sample <- min(colSums(table))
  if (sample == 'max' || as.numeric(sample) > min.sample) {
    sample <- min.sample
  }

  if (sample < 100) {
    PrintMsg(paste('"warning":"Very low counts detected in the following sample(s): ',
                        paste(names(table)[which(colSums(table) < 100)], collapse=','),
                        '."',
                        sep=''), verbose)
  } else if (sample < 1000) {
    PrintMsg(paste('"warning":"Low counts detected in the following sample(s): ',
                        paste(names(table)[which(colSums(table) < 1000)], collapse=','),
                        '."',
                        sep=''), verbose)
  }

  # Apply rarefaction
  table <- t(table)
  table.list <- list()
  for (i in 1:as.numeric(nsampling)) {
    table.list[[i]] <- rrarefy(table, sample=sample)
  }
  rarefied.table <- apply(simplify2array(table.list), c(1, 2), mean)
  # element-wise mean across rarefied tables

  PrintMsg(paste('"description":"The number of observations per samples were equalized using the rarefaction method with a sampling depth of ',
                        sample,
                        ' (random sampling without replacement) (R package vegan). The rarefied values were calculated as the means of ',
                        nsampling,
                        ' independent samplings that were rounded to the nearest integer."',
                        sep=''), verbose=verbose)

  return (data.frame(t(round(rarefied.table, digits=0))))
}


################
# Args:
#  (1) table    (numeric dataframe) Count table
#  (2) map      (dataframe) Design
#  (3) effect   (character) comma-delimited list of random effects to
#               suppress. Elements must be names of columns in mapping file
#  (4) verbose  (character) Print messages? see PrintMsg() options
# Returns:
#  A adjusted version of 'table' (a numeric dataframe)
# Prints to stdout:
#  A description of the function
################
SuppressBatchEffect <- function(table=NULL, map=NULL, effect=NULL,
                                fun='combat', verbose=TRUE) {
  method <- list(combat='ComBat', mean_centering='mean centering')
  PrintMsg(paste('"description":"Batch effect suppression on ',
                 effect,
                 ' using',
                 method[[fun]],
                 '"'),
           verbose)

  effect <- unlist(strsplit(effect, split=','))

  if (fun == 'mean_centering') {
    table <- t(table)

    for (i in 1:length(effect)) {
      fact <- map[effect[i]]
      fact.name <- as.vector(unique(unlist(fact)))
      nfact <- length(fact.name)

      for (j in 1:ncol(table)) {
        data <- data.frame(d=table[, j], fact=fact)
        means <- NULL
        for (k in 1:nfact) {
          means <- append(means, mean(data[fact == fact.name[k], 'd']))
        }
        for (k in 1:nfact) {
          adj <- max(means)-means[k]
          data[fact == fact.name[k], 'd'] <- data[fact == fact.name[k], 'd']+adj
        }
        table[, j] <- data$d
      }
    }
    table <- t(table)
  } else if (fun == 'combat') {
    suppressMessages(library('sva'))
    table <- ComBat(table, map[, effect])
  }
  return (table)
}


################
# Filter mapping file to keep only terms in model
# Args:
#  (1) map             (dataframe)
#  (2) model           (formula vector)
# Returns:
#  A filtered map
################
FilterMap <- function(map=NULL, model=NULL) {

  # keep only columns of map that are used in the model
  if (!is.null(model)) {
    term <- list()
    for (i in 1:length(model)) {
      term[[i]] <-as.vector(unique(unlist(strsplit(model[i], split=c('[^A-Za-z0-9_]')))))
      term[[i]] <- term[[i]][! term[[i]] %in% c("", " ", "1", "Error")]
    }
    term <- as.vector(unlist(term))
    row.names <- row.names(map)
    if (length(term) > 1) {
      map <- as.data.frame(map[, names(map) %in% term])
    } else {
      map <- as.data.frame(map[, names(map) == term])
      names(map) <- term
    }
    if (ncol(map) < length(unique(term))) {
      PrintMsg(paste('"error":"Some terms in model ',
               model,
               ' were not found in the map. Please make sure that all model terms refer to columns headers in the map."',
               sep=''),
               verbose=TRUE, TRUE)
    }
  }

  return (map)
}

################
# Remove constant rows from table
# Args:
#  (1) table             (dataframe)
# Returns:
#  A filtered table
################
RemoveConstantRows <- function(table=NULL, verbose=TRUE) {

  filter <- rep(TRUE, nrow(table))
  for (i in 1:nrow(table)) {
    if (length(as.vector(unique(unlist(table[i, ])))) < 2) {
      filter[i] <- FALSE
      PrintMsg(paste('"warning":"Row ', i, ' (', row.names(table)[i], ') contained essentially constant data and was removed."', sep=''),
               verbose=verbose)
    }
  }
  return (table[filter == TRUE, ])
}

################################################################################
################################################################################
# ANALYSIS #####################################################################
# ANALYSIS #####################################################################
# ANALYSIS #####################################################################
# ANALYSIS #####################################################################
################################################################################
################################################################################

################
# Apply a clustering algorithm
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) fun        (character) Clustering function (algorithme)
#  (3) json       (character) Json string specifying packages  
#  (4) verbose    (character) Print messages? see PrintMsg() options
#  (5) graphical  (logical) Generate graphics?
# Returns:
#  A table of clusters
# Output to device:
#  Depending on 'fun', a figure
# Prints to stdout:
#  A description of the function
################
PerformClustering <- function(table=NULL, fun=c('kmeans', 'pam', 'pam-bray', 'pam-jaccard'), json=libJson,
                              verbose=TRUE, graphical=TRUE) {

  if (ncol(table) < 10 || nrow(table) < 3) {
    PrintMsg('"warning":"Not enough data to perform clustering (min 10 column and 3 rows)."',
             verbose)
    return (NULL)
  } else if (ncol(table) > 65536) {
    PrintMsg('"warning":"Sorry, the dataset is too large for clustering algorithms (max 65536 columns)."',
             verbose)
    return (NULL)
  }
  spec <- as.data.frame(do.call('rbind', json$clustering))
  spec <- spec[spec$value == fun, ]
  package <- ''
  pkg <- unlist(strsplit(as.character(unlist(spec$pkg)), split=','))
  if (length(pkg) > 0) {
    for (i in 1:length(pkg)) {
      suppressMessages(library(pkg[i], character.only=TRUE))
    }
    package <- paste(' (R package {', unlist(spec$pkg), '})', sep='')
  }
  PrintMsg(paste('"description":"Clusters were determined using the ', spec$label,
           package, '."', sep=''),
           verbose)

  table <- t(table)

  if (fun == 'kmeans') {


    if (graphical == TRUE) {
      kmean.out <- kmeansruns(table, criterion='asw', plot=F)$cluster  # figure margins too large issue...
    } else {
      kmean.out <- kmeansruns(table, criterion='asw')$cluster
    }
    cluster <- paste('kmean',
                     kmean.out,
                     sep ='')

  } else if (fun == 'pam') {
    pam.out <- pamk(table, usepam=TRUE)
    if (graphical == TRUE) {
      plot(pam.out$pamobject, which.plots=2)
    }
    cluster <- paste('pam',
                     pam.out$pamobject$cluster,
                     sep ='')
  } else if (fun == 'pam-bray') {

    dist.data <- ComputeDistance(table=table, fun='bray', json=json,
                     verbose=verbose)

    pam.out <- pamk(dist.data, usepam=TRUE)
    if (graphical == TRUE) {
      plot(pam.out$pamobject, which.plots=2)
    }

    cluster <- paste('pam',
                     pam.out$pamobject$cluster,
                     sep ='')

  } else if (fun == 'pam-jaccard') {

    dist.data <- ComputeDistance(table=table, fun='jaccard', json=json,
                     verbose=verbose)

    pam.out <- pamk(dist.data, usepam=TRUE)
    if (graphical == TRUE) {
      plot(pam.out$pamobject, which.plots=2)
    }

    cluster <- paste('pam',
                     pam.out$pamobject$cluster,
                     sep ='')
  } else {
    return(NULL)
  }

  cluster <- as.data.frame(cluster)
  row.names(cluster) <- row.names(table)
  names(cluster) <- 'Clustering'
  PrintMsg(paste('"description":"Clusters: ',
           paste(paste(row.names(cluster), unlist(cluster), sep=':'), collapse=', '),
           '."', sep=''),
           verbose)
  return (cluster)
}

################
# Build a relative abundance stacked barplot
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) threshold  (numeric) Abundance cutoff for display in percent [0;100]
#  (3) verbose    (character) Print messages? see PrintMsg() options
#  (4) graphical  (logical) Generate graphics?
# Returns:
#  Figure data as a json string
# Output to device:
#  A figure
# Prints to stdout:
#  A description of the function
################
AnalyseProportions <- function(table=NULL,
                               map=NULL,
                               verbose=TRUE, graphical=TRUE) {

  # Convert to relative abundances per column
  PrintMsg('"description":"Data was converted to proportions (%) per sample."',
           verbose)
  if (min(table) < 0) {
    PrintMsg('"warning":"Negative values were found! Negative values are not supported by this analysis."',
             verbose)
    table <- as.data.frame(abs(table))
  }
  table <- as.data.frame(apply(table, 2, Numeric2Percent))

  # Order by decreasing values
  table <- as.data.frame(table[order(rowMeans(table), decreasing=TRUE), ])

  # Build stacked barchart
  if (as.logical(graphical) == TRUE) {
    col <- rainbow(nrow(table))
    par(mar=c(4, 4, 2, 4), xpd=TRUE)
    barplot(as.matrix(table),
            ylim=c(0, max(colSums(table))),
            space=0,
            border=NA,
            names.arg=names(table),
            ylab='%',
            col=col,
            las=2,
            bty="n",
            cex.names=1.84906*ncol(table)^-0.2898)
    # Build legend in a separate figure
    plot.new()
    legend("topleft", row.names(table), cex=0.8,
           fill=col, horiz=FALSE)
  }

  return (Dataframe2DataJson(data=table, xmetadata=map))
}

################
# Calculate diversity per column
# Args:
#  (1) table    (numeric dataframe) Count table
#  (2) fun      (character) The diversity function to use
#  (3) json     (character) Json string specifying packages
#  (4) verbose  (character) Print messages? see PrintMsg() options
# Returns:
#  A vector of length=ncol(table)
# Prints to stdout:
#  A description of the function
################
ComputeDiversity <- function(table=NULL, fun='shannon', json=libJson,
                             verbose=TRUE) {

  spec <- as.data.frame(do.call('rbind', json$diversity))
  spec <- spec[spec$value == fun, ]
  package <- ''
  pkg <- unlist(strsplit(as.character(unlist(spec$pkg)), split=','))
  if (length(pkg) > 0) {
    for (i in 1:length(pkg)) {
      suppressMessages(library(pkg[i], character.only=TRUE))
    }
    package <- paste(' (R package {', unlist(spec$pkg), '})', sep='')
  } else {
    pkg <- ''
  }

  PrintMsg(paste('"description":"The ',
                 spec$label,
                 package,
                 ' was calculated for each sample."', sep=''), verbose)

  diversity <- NULL
  if (pkg == 'vegan') {
    for (i in 1:ncol(table)) {
      diversity <- append(diversity, diversity(table[, i], index=fun, MARGIN=0,
                          base=2), after=length(diversity))
    }
  } else if (pkg == 'ineq') {
    for (i in 1:ncol(table)) {
      diversity <- append(diversity, ineq(table[, i], parameter=NULL, type=fun,
                          na.rm=TRUE), after=length(diversity))
    }
  } else if (fun == 'richness') {
    for (i in 1:ncol(table)) {
      diversity <- append(diversity, sum(table[, i] != 0),
                          after=length(diversity))
    }
  } else if (fun == 'chao1') {
    diversity <- chao1(table, taxa.row = TRUE)
  } else {
    PrintMsg(paste('"error":"Unknown argument to fun (2):', fun, '"', sep=' '),
             verbose, TRUE)
  }

  return (diversity)
}

################
# Compute correlations
# Args:
#  (1) table    (numeric dataframe) Count table
#  (2) fun      (character) The correlation methode to use
#  (3) json     (character) Json string specifying packages
#  (4) verbose  (character) Print messages? see PrintMsg() options
# Returns:
#  A vector of length=ncol(table)
# Prints to stdout:
#  A description of the function
################
ComputeCorrelation <- function(table=NULL, fun='pearson', test=FALSE,
                               json=libJson, verbose=TRUE) {

  spec <- as.data.frame(do.call('rbind', json$correlation))
  spec <- spec[spec$value == fun, ]
  package <- ''
  pkg <- unlist(strsplit(as.character(unlist(spec$pkg)), split=','))
  if (length(pkg) > 0) {
    for (i in 1:length(pkg)) {
      suppressMessages(library(pkg[i], character.only=TRUE))
    }
    package <- paste(' (R package {', unlist(spec$pkg), '})', sep='')
  }

  PrintMsg(paste('"description":"Calculated ', spec$label, package, '."', sep=''),
           verbose=verbose)

  if (as.logical(test) == TRUE) {
    cor.output <- list()
    cor.output[['estimate']] <- matrix(ncol=nrow(table), nrow=nrow(table))
    cor.output[['p.value']] <- matrix(ncol=nrow(table), nrow=nrow(table))
    for (i in 2:nrow(table)) {
      for (j in 1:(i-1)) {
        out <- cor.test(unlist(table[i, ]), unlist(table[j, ]), method=fun)
        cor.output[['estimate']][i, j] <- out$estimate
        cor.output[['p.value']][i, j] <- out$p.value
      }
    }
    cor.output[['estimate']][upper.tri(cor.output[['estimate']])] <- t(cor.output[['estimate']])[upper.tri(cor.output[['estimate']])]
    diag(cor.output[['estimate']]) <- 1
    cor.output[['p.value']][upper.tri(cor.output[['p.value']])] <- t(cor.output[['p.value']])[upper.tri(cor.output[['p.value']])]
    diag(cor.output[['p.value']]) <- 0
    return (cor.output)
  }

  if (fun == 'pearson') {
    return (cor(t(table), method=fun, use='pairwise.complete.obs'))
  } else {
    return (cor(t(table), method=fun, use='na.or.complete'))
  }
}

################
# Compute distances
# Args:
#  (1) table    (numeric dataframe) Count table
#  (2) fun      (character) The distance function to use
#  (3) json     (character) Json string specifying packages
#  (4) verbose  (character) Print messages? see PrintMsg() options
# Returns:
#  A vector of length=ncol(table)
# Prints to stdout:
#  A description of the function
################
ComputeDistance <- function(table=NULL, fun='bray', json=libJson,
                            verbose=TRUE) {

  spec <- as.data.frame(do.call('rbind', json$distance))
  spec <- spec[spec$value == fun, ]
  package <- ''
  pkg <- unlist(strsplit(as.character(unlist(spec$pkg)), split=','))
  if (length(pkg) > 0) {
    for (i in 1:length(pkg)) {
      suppressMessages(library(pkg[i], character.only=TRUE))
    }
    package <- paste(' (R package {', unlist(spec$pkg), '})', sep='')
  }


  if (fun %in% c('pearson', 'spearman')) {

    PrintMsg(paste('"description":"A distance matrix was calculated based on ',
                          spec$label, package, '."', sep=''), verbose=verbose)
    return (as.dist(as.matrix(ComputeCorrelation(table, fun=fun, json=json,
                                         verbose=FALSE))))

  } else {
    # Correct for negative entries by adding a scalar (Caillez correction method)
    if (min(table) < 0) {

      table <- table+abs(min(table))

      PrintMsg(paste('"description":"A Caillez correction was applied and a distance matrix was calculated based on ',
               spec$label, package, '."', sep=''), verbose=verbose)

    } else {
      PrintMsg(paste('"description":"A distance matrix was calculated based on ',
                            spec$label, package, '."', sep=''), verbose=verbose)
    }

    if ('vegan' %in% pkg) {
      return (vegdist(table, method=fun, binary=FALSE, diag=TRUE, upper=TRUE))
    }
  }

}

################
# Test if model is balanced
# Args:
#  (1) map       (data-frame) Experimental design table
#  (2) model     (character) A formula representing the model for stats. Terms
#                must refer to names(map)
#  (3) verbose   (character) Print messages? see PrintMsg() options
# Returns:
#  A bool indicating whether the design is balanced or not
################
ModelIsBalanced <- function(map=NULL, model=NULL, verbose='TRUE') {
  # keep only columns of map that are used in the model
  map <- FilterMap(map=map, model=model)
  for (i in 1:ncol(map)) {
    fact <- as.vector(unique(unlist(map[, i])))
    n <- length(map[map[, i] == fact[1], i])
    if (length(fact) > 1) {
      for (j in 2:length(fact)) {
        if (length(map[map[, i] == fact[j], i]) != n) {
          PrintMsg('log', paste('Model ',model , ' is not balanced.', sep=''), verbose=verbose)
          return (FALSE)
        }
      }
    }
  }

  PrintMsg('note', paste('Model ',model , ' is balanced.', sep=''), verbose=verbose)
  return (TRUE)
}

################
# Test if model's variables could be nested
# Args:
#  (1) map       (data-frame) Experimental design table
#  (2) model     (character) A formula representing the model for stats. Terms
#                must refer to names(map)
#  (3) verbose   (character) Print messages? see PrintMsg() options
# Returns:
#  A list of nested variables
################
ModelIsNested <- function(map=NULL, model=NULL, verbose='TRUE') {

  # keep only columns of map that are used in the model
  map <- FilterMap(map=map, model=model)
  if (ncol(map) < 2) {
    return (NULL)
  }

  out <- list()
  out.txt <- NULL
  for (i in 1:ncol(map)) {
    fact <- as.vector(unique(unlist(map[, i])))
    test <- as.data.frame(map[, -i])
    names(test) <- names(map)[-i]
    out[[names(map)[i]]] <- NULL
    for (j in 1:ncol(test)) {
      group1 <- as.vector(test[map[, i] == fact[1], j])
      nested <- TRUE
      if (length(as.vector(unique(map[, i]))) >= length(as.vector(unique(test[, j])))) {
        nested <- FALSE
      } else if (length(as.vector(unique(group1))) != length(group1)) {
        nested <- FALSE
      } else {
        for (k in 2:length(fact)) {
          if (!identical(group1, as.vector(test[map[, i] == fact[k], j]))) {
            nested <- FALSE
            break
          }
        }
      }
      if (nested == TRUE) {
        out[[names(map)[i]]] <- append(out[[names(map)[i]]], names(test)[j], after=length(out[[names(map)[i]]]))
        out.txt <- append(out.txt, paste(names(test)[i], names(map)[j], sep='/'), after=length(out.txt))
      }
    }
  }
  if (length(out) == 0) {
    return (NULL)
  }
  PrintMsg('log', paste('The following nesting was detected in model ',
           model,
           ': ',
           paste(out.txt, collapse=', '),
           ' Please control that the model is the one you want.',
           sep=''), verbose=verbose)
  return (out)
}

################
# Compute statistics
# Args:
#  (1) response  (numeric vector)
#  (2) map       (data-frame) Experimental design table with
#                nrow=length(response)
#  (3) method    (character) Statistics to use
#  (4) model     (character) A formula representing the model for stats. Terms
#                must refer to names(map)
#  (5) pairwise  (bool) Perform pairwise comparision?
#  (6) verbose   (character) Print messages? see PrintMsg() options
# Returns:
#  A data-frame
# Prints to stdout:
#  A description of the function
################
ComputeStats <- function(response=NULL, map=NULL, method='anova',
                         model=NULL, pairwise=TRUE, verbose=TRUE) {

  if (is.null(method)) {
    method <- 'anova'
    PrintMsg('"warning":"The statistical method was not specified. An ANOVA will be performed by default."', verbose)
  }

  # If no model is specified, assume all columns in map are fixed variables
  if (is.null(model)) {
    model <- paste(names(map), collapse='+')
    PrintMsg(paste('"warning":"No model was specified. Based on the map, the following model will be used by default: ',
            model,
            '."',
            sep=''), verbose)
  }
  # Test that each factor has >= 2 levels
  term <- as.vector(unique(unlist(strsplit(model, split=c('[^A-Za-z0-9_]')))))
  term <- term[! term %in% c("", " ", "1", "Error")]
  for (i in 1:length(term)) {
    if (!term[i] %in% names(map)) {
      PrintMsg(paste('"error":"The following model factor was not found in map: ',
              term[i],
              '. Please correct the model or correct the map."',
              sep=''), verbose=TRUE, stop=TRUE)
    }
    levels <- as.vector(unique(unlist(map[, term[i]])))
    if (length(levels) < 2) {
      PrintMsg(paste('"error":"The following model factor has less than 2 levels: ',
              term[i],
              '. Please correct the model or correct the map."',
              sep=''), verbose=TRUE, stop=TRUE)
    }
    for (j in 1:length(levels)) {
      if (length(map[map[, term[i]] == levels[j], ]) == 1) {
        PrintMsg(paste('"warning":"The following group contains only one element (variance is null): ',
                levels[j],
                '. This will impact on statistics."',
                sep=''), TRUE)
      }
    }
  }

  response.name <- 'response'
  while (response.name %in% names(map)) {
    response.name <- paste('response', paste(sample(c(letters, LETTERS, c(0:9)), 4), collapse=''), sep='')
  }
  names(response) <- response.name
  formula <- paste(response.name, ' ~ ', model, sep='')

  # Build the dataframe
  data <- map
  data <- cbind(map, response)

  pairwise.output <- NULL
  if (method == 'anova' || is.null(method)) {
    # PARAMETRIC, ACCEPTS MODELS WITH >2 FACTORS, MULTIPLE FIXED VARIABLES AND NESTING
    # MODEL CAN BE OF THE FORM "a*b+c"

    PrintMsg(paste('"description":"An analysis of variance (ANOVA) was performed using the model: ', model,
             '."', sep=''), verbose)

    aov.output <- aov(formula=as.formula(formula), data=data)

    if (pairwise == TRUE) {
      pairwise.output <- TukeyHSD(aov.output)
    }

    summary <- as.data.frame(summary(aov.output)[[1]])
    if ('Pr(>F)' %in% names(summary)) {
      p.value <- summary[, 'Pr(>F)']
    } else {
      PrintMsg(paste('"warning":"Impossible to calculate a p-value. Please make sure that the model ',
               model, ' is not saturated."',
               sep=''), verbose)
      p.value <- rep('NA', nrow(summary))
    }

    summary <- data.frame(row.names=gsub('[[:space:]]', '', row.names(summary)),
                          p.value=p.value)
                     #explained=summary[, 'Sum Sq']/sum(summary[, 'Sum Sq']))

  } else if (method == 'friedman') {
    # NON-PARAMETRIC, ACCEPTS MODELS WITH >2 FACTORS BUT REQUIRES EXACTLY 2 NESTED VARIABLE
    # MODEL HAS TO BE OF THE FORM "a | b"
    friedman.terms <- unlist(strsplit(model, split=' '))
    if (length(friedman.terms) != 3 || friedman.terms[2] != '|') {
      PrintMsg(paste('"error":"The model must be of the form a | b when using Friedman test. Please provide an appropriate model. The current model is: ',
               model, '."', sep=''), verbose, TRUE)
    }

    friedman.output <- friedman.test.with.post.hoc(formula=as.formula(formula), data=data)

    PrintMsg(paste('"description":"A Friedman test was performed using the model: ', model,
                   '."', sep=''), verbose)

    if (pairwise == TRUE) {
      pairwise.output <- list()
      pairwise.output[[term[1]]] <- data.frame(row.names=paste(unique(unlist(map[, term[1]])), collapse='-'),
                                              p=friedman.output$PostHoc.Test)
      PrintMsg('"description":"A post-hoc test with correction for multiple comparisions was performed."', verbose)
    }

    summary <- data.frame(row.names=term[1],
                          p.value=friedman.output$Friedman.Test)

  } else if (method == 'kruskal') {
    # NON-PARAMETRIC, ACCEPTS MODELS WITH >2 FACTORS BUT ONLY 1 FIXED VARIABLE
    # MODEL CAN BE OF THE FORM "a"
    if (length(term) > 1) {
      PrintMsg(paste('"error":"The model cannot include more than 1 variable when using Kruskal-Wallis rank sum test. Please provide an appropriate model. The current model is: ',
               model, ' (', length(term), ' variables)."', sep=''), verbose, TRUE)
    }

    suppressMessages(library('dunn.test'))
    dunn.output <- dunn.test(data[, response.name], g=map[, term[1]], kw=FALSE, table=FALSE, list=FALSE)

    PrintMsg(paste('"description":"A Kruskal-Wallis rank sum test was performed using the model: ', model,
                   '."', sep=''), verbose)

    if (pairwise == TRUE) {  
      pairwise.output <- list()
      pairwise.output[[term[1]]] <- data.frame(row.names=paste(unique(unlist(map[, term[1]])), collapse='-'),
                                              p=dunn.output$P)
      PrintMsg('"description":"A post-hoc test with correction for multiple comparisions (R library {dunn.test}) was performed."', verbose)
    }

    summary <- data.frame(row.names=term[1],
                          p.value=pchisq(dunn.output$chi2, nrow(data)-1, lower.tail=FALSE))


  } else if (method == 'wilcox') {
    # NON-PARAMETRIC, ACCEPTS MODELS WITH 2 FACTORS ONLY AND ONE FIXED VARIABLES
    # MODEL HAS TO BE OF THE FORM "a"
    if (length(term) > 1) {
      PrintMsg(paste('"error":"The model cannot include more than 1 variable when using Wilcoxon rank sum test. Please provide an appropriate model. The current model is: ',
               model, ' (', length(term), ' variables)."', sep=''), verbose, TRUE)
    }
    samples <- unique(unlist(data[, model]))
    if (length(samples) != 2) {
      PrintMsg(paste('"error":"The Wilcoxon rank sum test can only perform two samples comparison. Please provide an appropriate model. The current model includes the following samples: ',
               sample, '."', sep=''), verbose, TRUE)
    }

    wilcox.output <- wilcox.test(formula=as.formula(formula), data=data)
    PrintMsg(paste('"description":"A Wilcoxon rank sum test was performed using the model: ', model,
                   '."', sep=''), verbose)

    summary <- data.frame(row.names=paste(samples, collapse='-'),
                          p.value=wilcox.output$p.value)

    pairwise.output <- list()
    pairwise.output[[model]] <- as.data.frame(wilcox.output$p.value)
    names(pairwise.output[[model]]) <- model
    row.names(pairwise.output[[model]]) <-paste(samples, collapse='-')

  } else if (method == 'wilcox_paired') {
    # NON-PARAMETRIC, ACCEPTS MODELS WITH 2 FACTORS ONLY AND ONE FIXED VARIABLES. NESTING IS ASSUMED FROM THE ORDER OF THE DATA!
    # MODEL HAS TO BE OF THE FORM "a"
    if (length(term) > 1) {
      PrintMsg(paste('"error":"The model cannot include more than 1 variable when using Wilcoxon signed rank test. Please provide an appropriate model. The current model is: ',
               model, ' (', length(term), ' variables)."', sep=''), verbose, TRUE)
    }
    samples <- unique(unlist(data[, model]))
    if (length(samples) != 2) {
      PrintMsg(paste('"error":"The Wilcoxon signed rank test can only perform two samples paired comparison. Please provide an appropriate model. the current model includes the following samples: ',
               paste(sample, collapse=', '),
               '."',
               sep=''),
               verbose, TRUE)
    }
    x <- data[data[, model] == samples[1], model]
    y <- data[data[, model] == samples[2], model]
    if (length(x) != length(y)) {
      PrintMsg(paste('"error":"A paired comparison in Wilcoxon signed rank test is possible only if samples have same size. Please provide an appropriate model, correct the map or use different statistics. Current samples are: ',
               samples[1],
               '(n=',
               length(x),
               '), ',
               samples[2],
               '(n=',
               length(y),
               ')."',
               sep=''),
               verbose, TRUE)
    }

    wilcox.output <- wilcox.test(formula=as.formula(formula), data=data, paired=TRUE)
    PrintMsg(paste('"description":"A Wilcoxon signed rank test was performed using the model: ',
                   model,
                   '. Paires: ',
                   paste(paste(row.names(data)[data[, model] == samples[1]], row.names(data)[data[, model] == samples[2]], sep='-'), collapse=', '),
                   '."', sep=''), verbose)

    summary <- data.frame(row.names=paste(samples, collapse='-'),
                          p.value=wilcox.output$p.value)

    pairwise.output <- list()
    pairwise.output[[model]] <- as.data.frame(wilcox.output$p.value)
    names(pairwise.output[[model]]) <- model
    row.names(pairwise.output[[model]]) <-paste(samples, collapse='-')

  } else if (method == 'ttest') {
    # PARAMETRIC, ACCEPTS MODELS WITH 2 FACTORS ONLY AND ONE FIXED VARIABLES.
    # MODEL HAS TO BE OF THE FORM "a"
    if (length(term) > 1) {
      PrintMsg(paste('"error":"The model cannot include more than 1 variable when using t-test. Please provide an appropriate model. The current model is: ',
               model, ' (', length(term), ' variables)."', sep=''), verbose, TRUE)
    }
    samples <- unique(unlist(data[, model]))
    if (length(samples) != 2) {
      PrintMsg(paste('"error":"A t-test can only perform two samples comparison. Please provide an appropriate model. The current model includes the following samples: ',
               paste(sample, collapse=', '),
               '."',
               sep=''),
               verbose, TRUE)
    }

    ttest.output <- t.test(formula=as.formula(formula), data=data)
    PrintMsg(paste('"description":"A paired t-test was performed using the model: ',
                   model,
                   '."',
                   sep=''),
                   verbose)

    summary <- data.frame(row.names=paste(samples, collapse='-'),
                          p.value=ttest.output$p.value)

    pairwise.output <- list()
    pairwise.output[[model]] <- as.data.frame(ttest.output$p.value)
    names(pairwise.output[[model]]) <- model
    row.names(pairwise.output[[model]]) <-paste(samples, collapse='-')

  } else if (method == 'ttest_paired') {
    # PARAMETRIC, ACCEPTS MODELS WITH 2 FACTORS ONLY AND ONE FIXED VARIABLES. NESTING IS ASSUMED FROM THE ORDER OF THE DATA!
    # MODEL HAS TO BE OF THE FORM "a"
    if (length(term) > 1) {
      PrintMsg(paste('"error":"A model cannot include more than 1 variable when using t-test. Please provide an appropriate model. The current model is: ',
               model, ' (', length(term), ' variables)."', sep=''), verbose, TRUE)
    }
    samples <- unique(unlist(data[, model]))
    if (length(samples) != 2) {
      PrintMsg(paste('"error":"A paired t-test can only perform two samples comparison. Please provide an appropriate model. The current model includes the following samples: ',
               paste(sample, collapse=', '),
               '."',
               sep=''),
               verbose, TRUE)
    }
    x <- data[data[, model] == samples[1], model]
    y <- data[data[, model] == samples[2], model]
    if (length(x) != length(y)) {
      PrintMsg(paste('"error":"A paired comparison in t-test is possible only if samples have same size. Please provide an appropriate model, correct the map or use different statistics. The current samples are: ',
               samples[1],
               '(n=',
               length(x),
               '), ',
               samples[2],
               '(n=',
               length(y),
               ')."',
               sep=''),
               verbose, TRUE)
    }

    ttest.output <- t.test(formula=as.formula(formula), data=data, paired=TRUE)
    PrintMsg(paste('"description":"A paired t-test was performed using the model: ',
                   model,
                   '. Paires: ',
                   paste(paste(row.names(data)[data[, model] == samples[1]], row.names(data)[data[, model] == samples[2]], sep='-'), collapse=', '),
                   '."', sep=''), verbose)

    summary <- data.frame(row.names=paste(samples, collapse='-'),
                          p.value=ttest.output$p.value)

    pairwise.output <- list()
    pairwise.output[[model]] <- as.data.frame(ttest.output$p.value)
    names(pairwise.output[[model]]) <- model
    row.names(pairwise.output[[model]]) <-paste(samples, collapse='-')
  }

  stat <- list(summary=summary, pairwise=pairwise.output)
  return (stat)
}

################
# Plot rarefaction curves
# Args:
#  (1) data      (numeric matrix) rarefaction table
# Output to device:
#  A figure
################
PlotRarefactionCurves <- function(data=NULL, xlab='Rarefaction depth', ylab='') {
  color.palette <- rainbow(ncol(data))
  plot(x=row.names(data),
       y=c(1:nrow(data)),
       type="n",
       ylim=c(min(data), max(data)),
       xlab=xlab,
       ylab=ylab)

  for (i in 1:ncol(data)) {
    lines(x=row.names(data),
          y=data[, i],
          col=color.palette[i])
  }
  return ()
}

################
# Perform a diversity analysis
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) map        (data-frame) Experimental design table with nrow=ncol(table)
#  (3) fun        (character) The diversity function to use
#  (4) model      (formula vector) A formula representing the model for stats. Terms
#                 must refer to names(map)
#  (5) json       (character) Json string specifying packages
#  (6) verbose    (character) Print messages? see PrintMsg() options
#  (7) graphical  (logical) Generate graphics?
# Returns:
#  Figure data as a json string
# Output to device:
#  A figure
# Prints to stdout:
#  A description of the function
################
AnalyseDiversity <- function(table=NULL, map=NULL, fun=c('richness', 'shannon'),
                             nrar=20, compare_diversity=FALSE, stats=NULL, model=NULL,
                             json=libJson, verbose=TRUE, graphical=TRUE) {
  if (is.null(fun)) {
    fun <- 'richness'
  }
  suppressMessages(library('vegan'))

  fun <- fun[fun != '']

  # Compute rarefaction curves for diversity
  colsums <- colSums(table)
  min.colsum <- floor(min(colsums))
  ncol <- ncol(table)
  sample <- matrix(rep(floor(seq(from=0, to=min.colsum, length.out=nrar)), ncol), ncol=ncol, byrow=FALSE)
  diversity <- list()
  map <- FilterMap(map=map, model=model)

  rarefied.table <- list()
  for (i in 1:nrar) {
    rarefied.table[[i]] <- rrarefy(t(table), sample=apply(rbind(sample[i, ], colsums), 2, min))
  }

  PrintMsg('"description":"This is a diversity analysis."', verbose)

  PrintMsg(paste('"description":"The dataset was rarefied until ', min.colsum, ' counts per sample."', sep=''), verbose)

  data.json <- c(1:length(fun))
  for (i in 1:length(fun)) {
    div <- matrix(ncol=ncol, nrow=0)
    v <- TRUE
    for (j in 1:nrar) {
      div <- rbind(div,
                   ComputeDiversity(table=t(rarefied.table[[j]]),
                                    fun=fun[i],
                                    json=json,
                                    verbose=v))
      v <- FALSE
    }
    colnames(div) <- colnames(table)
    row.names(div) <- sample[, 1]

    diversity[[i]] <- as.matrix(div)

    # Build figures
    if (graphical == TRUE) {
      PlotRarefactionCurves(div, ylab=fun[i])
    }

    # Calculate statistics
    if (compare_diversity == TRUE) {
      p.value <- list()
      for (j in 1:length(model)) {
        if (length(stats) == length(model)) {
          method <- stats[j]
        } else {
          method <- stats[1]
        }
        stat <- ComputeStats(response=div[nrar, ], map=map, method=method,
                             model=model[j], pairwise=FALSE, verbose=TRUE)$summary
        p <- as.data.frame(t(as.matrix(stat$p.value)))
        names(p) <- row.names(stat)
        p <- as.data.frame(p[, names(p) != 'Residuals'])
        # the following is usefull in case model contains only one element
        names(p) <- row.names(stat)[row.names(stat) != 'Residuals']
        row.names(p) <- fun[i]
        p.value[[j]] <- p
      }
      PrintMsg(paste('"description":"The statistics were performed at a rarefaction depth of ', min.colsum, ' counts per sample."', sep=''), verbose)
    } else {
      p.value <- NULL
    }
    data.json[i] <- paste('"', fun[i], '":', diversity2json(diversity[[i]], p.value, map), sep='')
  }

  return (paste('{', paste(data.json, collapse=','), '}', sep=''))
}


################
# Permutational Multivariate Analysis of Variance Using Distance Matrices
# Args:
#  (1) model      (character)
#  (2) map        (data-frame) Experimental design table with nrow=ncol(table)
#  (3) fun        (character) The distance function to use
#  (4) graphical  (logical) Generate graphics?
# Returns:
#  A summary (data-frame)
# Prints to stdout:
#  A description of the function
################
Adonis <- function(table=NULL, model=NULL, strata=NULL, map=NULL,
                   fun='bray', graphical=TRUE) {

  if (!is.null(model)) {
    formula <- paste('table ~ ', model, sep='')
  } else {
    formula <- paste('table ~ ', paste(names(map), collapse='*'), sep='')}

  if (!is.null(strata)) {
    if (strata == '') {
      strata == NULL
    } else {
      #formula <- paste(formula, strata, sep=' / ')
      strata <- map[, strata]
    }
  }

  adonis.output <- adonis(formula=as.formula(formula), data=as.data.frame(map),
                          strata=strata, method=fun,
                          permutations=1000)

  summary <- data.frame(row.names=row.names(adonis.output$aov.tab))

  summary <- data.frame(row.names=gsub('[[:space:]]', '',
                                       row.names(adonis.output$aov.tab)),
                        p.value=adonis.output$aov.tab[, 'Pr(>F)'],
                        explained=adonis.output$aov.tab[, 'R2'])

  summary <- summary[row.names(summary) != 'Total', ]

  # Build the figure
  if (graphical == TRUE) {

    pie(summary$explained,
        labels=row.names(summary),
        col=rainbow(length(summary$explained)),
        init.angle=0,
        radius=0.7,
        cex=0.7,
        xpd=TRUE)
    legend(x=-1, y=-1, xjust=1, yjust=0.5,
           title='p-value',
           legend=round(summary$p.value, digits=4),
           fill=rainbow(nrow(summary)),
           cex=0.7, xpd=TRUE)
  }

  return (summary)
}


################
# Permutational Multivariate Analysis of Variance Using Distance Matrices
# Args:
#  (1) table           (numeric dataframe) Count table
#  (2) map             (data-frame) Experimental design table with nrow=ncol(table)
#  (3) fun             (character) The distance function to use
#  (4) model           (character vector) A formula representing the model for stats. Terms
#                      must refer to names(map)
#                      must refer to names(map)
#  (5) verbose         (character) Print messages? see PrintMsg() options
#  (6) graphical       (logical) Generate graphics?
# Returns:
#  Figure data as a json string
# Output to device:
#  A figure
# Prints to stdout:
#  A description of the function
################
PerformAdonis <- function(table=NULL, map=NULL, fun='bray',
                          model=NULL, strata=NULL,
                          json=libJson, verbose=TRUE, graphical=TRUE) {

  suppressMessages(library('vegan'))

  #out.json <- c(1:length(fun))
  #for (k in 1:length(fun)) {

  spec <- as.data.frame(do.call('rbind', json$distance))
  spec <- spec[spec$value == fun, ]
  package <- ''
  pkg <- unlist(strsplit(as.character(unlist(spec$pkg)), split=','))
  if (length(pkg) > 0) {
    package <- paste(' (R package {', unlist(spec$pkg), '})', sep='')
  }

  PrintMsg(paste('"description":"This is a permutational multivariate analysis of variance using the Adonis method (R package {vegan}) based on the ',
           spec$label,
           package,
           '."',
           sep=''),
           verbose)

  # Correct for negative entries by adding a scalar (Caillez correction method)
  if (min(table) < 0) {
    c <- abs(min(table))
    table <- table+c

    PrintMsg(paste('"description":"Negative values were corrected using a Caillez correction (',
             c,
             ' added to all values)."',
             sep=''),
             verbose)
  }

  if (is.null(strata) || strata == '') {
    strata <- rep(NULL, length(model))
  }
  if (!is.null(strata) && length(strata) != length(model)) {
    PrintMsg(paste('"warning":"Number of strata (',
                   length(strata),
                   ') differs from number of models(',
                   length(model),
                   '). No strata will be used."',
                   sep=''),
                   verbose)

    strata <- rep(NULL, length(model))
  }

  # Perform perMANOVA
  #map <- FilterMap(map=map, model=model)
  data.json <- c(1:length(model))
  for (i in 1:length(model)) {
    stat <- Adonis(table=t(table),
                   model=model[i], strata=strata[i], map=map,
                   fun=fun, graphical=graphical)

    stat.json <- c(1:nrow(stat))
    for (j in 1:nrow(stat)) {

      stat.json[j] <- paste('{"name":"',
                            row.names(stat)[j],
                            '","p-value":"',
                            stat$p.value[j],
                            '","explained":"',
                            stat$explained[j],
                            '"}',
                            sep='')
    }
    data.json[i] <- paste('"',
                     model[i],
                     '":[',
                     paste(stat.json, collapse=','),
                     ']',
                     sep='')
  }

  #out.json[k] <- paste('"',
  #                     fun[k],
  #                     '":"{',
  #                     paste(data.json, collapse=','),
  #                     '}',
  #                     sep='')
  #}
  #return (paste('{',paste(out.json, collapse=','), '}', sep=''))

  return (paste('{',paste(data.json, collapse=','), '}', sep=''))
}

################
# Principal Component Analysis (PCA)
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) map        (data-frame) Experimental design table with nrow=ncol(table)
#  (3) model      (character vector) A formula representing the model for stats. Terms
#                 must refer to names(map)
#  (4) col        (character) Name of a column in map to use to define colors
#  (5) biplot     (numeric) Show n=biplot factors with biggest norms on the
#                 biplot
#  (6) verbose    (character) Print messages? see PrintMsg() options
#  (7) graphical  (logical) Generate graphics?
# Returns:
#  Figure data as a json string
# Output to device:
#  A figure
# Prints to stdout:
#  A description of the function
################
PerformPCA <- function(table=NULL, map=NULL, biplot=TRUE,
                       verbose=TRUE, graphical=TRUE) {

  suppressMessages(library('FactoMineR'))

  ncp <- min(max(2, ncol(table)), 5)
  pca.output <- PCA(t(table), ncp=ncp, scale.unit=FALSE, graph=FALSE)

  if (graphical == TRUE) {
    plot(pca.output, new.plot=FALSE)
  }

  # Pack data into a json string
  data.ind <- as.data.frame(t(as.data.frame(pca.output$ind$coord)))
  row.names(data.ind) <- gsub('Dim.', 'PC', row.names(data.ind))

  data.json <- Dataframe2DataJson(data=data.ind, xmetadata=map)

  eig.json <- c(1:ncp)
  for (i in 1:ncp) {
    eig.json[i] <- paste('"PC',
                         i,
                         '":"',
                         pca.output$eig[i, 2],
                         '"',
                         sep='')
  }

  if (biplot == TRUE) {
    data.var <- as.data.frame(t(as.data.frame(pca.output$var$coord)))
    row.names(data.var) <- gsub('Dim.', 'PC', row.names(data.var))

    data.json <- paste('{"ind":',
                  data.json,
                  ',"var":',
                  Dataframe2DataJson(data=data.var),
                  ',"eig":{',
                  paste(eig.json, collapse=','),
                  '}}',
                  sep='')
  } else {
    data.json <- paste('{"data":',
                  data.json,
                  ',"eig":{',
                  paste(eig.json, collapse=','),
                  '}}',
                  sep='')
  }

  PrintMsg('"description":"This is a principal component analysis (PCA) (R package {FactoMineR})."',
           verbose)

  return (data.json)
}

################
# Correspondence Analysis (CA)
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) map        (data-frame) Experimental design table with nrow=ncol(table)
#  (3) model      (character vector) A formula representing the model for stats. Terms
#                 must refer to names(map)
#  (4) col        (character) Name of a column in map to use to define colors
#  (5) biplot     (numeric) Show n=biplot factors with biggest norms on the
#                 biplot
#  (6) verbose    (character) Print messages? see PrintMsg() options
#  (7) graphical  (logical) Generate graphics?
# Returns:
#  Figure data as a json string
# Output to device:
#  A figure
# Prints to stdout:
#  A description of the function
################
PerformCA <- function(table=NULL, map=NULL,
                      verbose=TRUE, graphical=TRUE) {

  suppressMessages(library('FactoMineR'))

  ncp <- min(max(2, ncol(table)), 5)
  ca.output <- CA(table, ncp=ncp, graph=FALSE)

  if (graphical == TRUE) {
    plot(ca.output, new.plot=FALSE)
  }

  # Pack data into a json string
  data.ind <- as.data.frame(t(as.data.frame(ca.output$col$coord)))
  data.json <- Dataframe2DataJson(data=data.ind, xmetadata=map)

  eig.json <- c(1:ncp)
  for (i in 1:ncp) {
    eig.json[i] <- paste('"Dim',
                         i,
                         '":"',
                         ca.output$eig[i, 2],
                         '"',
                         sep='')
  }

  data.var <- t(as.data.frame(ca.output$row$coord))

  data.json <- paste('{"ind":',
                  data.json,
                  ',"var":',
                  Dataframe2DataJson(data=data.var),
                  ',"eig":{',
                  paste(eig.json, collapse=','),
                  '}}',
                  sep='')

  PrintMsg('"description":"This is a correspondence analysis (CA) (R package {FactoMineR})."',
           verbose)

  return (data.json)
}

################
# Principal Coordinates Analysis (PCoA)
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) map        (data-frame) Experimental design table with nrow=ncol(table)
#  (3) fun        (character) The distance function to use
#  (4) model      (character vector) A formula representing the model for stats. Terms
#                 must refer to names(map)
#  (5) col        (character) Name of a column in map to use to define colors
#  (6) json       (character) Json string specifying packages
#  (7) verbose    (character) Print messages? see PrintMsg() options
#  (8) graphical  (logical) Generate graphics?
# Returns:
#  Figure data as a json string
# Output to device:
#  A figure
# Prints to stdout:
#  A description of the function
################
PerformPCoA <- function(table=NULL, map=NULL, fun='bray',
                        json=libJson, verbose=TRUE, graphical=TRUE) {

  spec <- as.data.frame(do.call('rbind', json$distance))
  spec <- spec[spec$value == fun, ]
  package <- ''
  pkg <- unlist(strsplit(as.character(unlist(spec$pkg)), split=','))
  if (length(pkg) > 0) {
    for (i in 1:length(pkg)) {
      suppressMessages(library(pkg[i], character.only=TRUE))
    }
    package <- paste(' (R package {', unlist(spec$pkg), '})', sep='')
  }


  dist <- as.matrix(ComputeDistance(table=Transpose(table),
                                    fun=fun, json=json, verbose=FALSE))
  row.names(dist) <- names(table)

  data.json <- PerformPCA(table=dist, map=map, biplot=FALSE,
                          verbose=FALSE, graphical=graphical)

  PrintMsg(paste('"description":"This is a principal coordinate analysis (PCoA) (R package {FactoMineR}) based on ',
                 spec$label,
                 package,
                 '."',
                 sep=''),
           verbose)

  return (data.json)
}

################
# Canonical Correlation Analysis (CCA)
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) map        (data-frame) Experimental design table with nrow=ncol(table)
#  (3) model      (character vector) A formula representing the model for stats. Terms
#                 must refer to names(map)
#  (4) col        (character) Name of a column in map to use to define colors
#  (5) biplot     (numeric) Show n=biplot factors with biggest norms on the
#                 biplot
#  (6) verbose    (character) Print messages? see PrintMsg() options
#  (7) graphical  (logical) Generate graphics?
# Returns:
#  Figure data as a json string
# Output to device:
#  A figure
# Prints to stdout:
#  A description of the function
################
PerformCCA <- function(table=NULL, map=NULL, column=NULL,
                       verbose=TRUE, graphical=TRUE) {

  suppressMessages(library('vegan'))

  table <- as.data.frame(t(table))
  names <- unlist(strsplit(column, split=','))
  categs <- as.data.frame(map[, names])
  names(categs) <- names
  row.names(categs) <- row.names(map)

  cca.output <- cca(table ~ ., data=categs)

  if (graphical == TRUE) {
    plot(cca.output)
  }

  # Pack data into a json string
  data.ind <- as.data.frame(t(cca.output$CCA$u))
  data.var <- as.data.frame(t(cca.output$CCA$v))
  data.biplot <- as.data.frame(t(cca.output$CCA$biplot))
  data.json <- paste('{"ind":',
                  Dataframe2DataJson(data=data.ind, xmetadata=map),
                  ',"var":',
                  Dataframe2DataJson(data=data.var),
                  ',"biplot":',
                  Dataframe2DataJson(data=data.biplot),
                  '}',
                  sep='')

  PrintMsg(paste('"description":"This is a canonical correspondence analysis (CCA) (R package {vegan}) with the following constraining variable(s):',
           column,
           '."',
           sep=''),
           verbose)

  return (data.json)
}

################
# Compute fold-change
# Args:
#  (1) response  (numeric vector) Data
#  (2) factor    (vector) Experimental design vector with
#                nrow=length(response)
#  (3) by        (dataframe) A nested variable to use for calculating
#                fold-changes
#  (4) balanced  (bool) assume that model balanced? If NULL, balance will be tested
#  (5) verbose   (character) Print messages? see PrintMsg() options
# Returns:
#  A data-frame containing fold-changes for each variable in model
# Prints to stdout:
#  A description of the function
################
ComputeFoldChange <- function(group1=NULL, group2=NULL, names=NULL, verbose=TRUE) {

  out <- list()
  out[['logfc']] <- log2(mean(group2))-log2(mean(group1))
  out[['ab']] <- mean(c(group2, group1))

  PrintMsg(paste('"description":"Fold-change is calculated as log2(mean(',
                 names[2],
                 '))-log2(mean(',
                 names[1],
                 ')) and abundance is calculated as (mean(',
                 names[1],
                 ')+mean(',
                 names[2],
                 '))/2."',
                 sep=''),
           verbose)
  return(out)
}


################
# Extract group of samples from map
# Args:
#  (1) map      (data-frame) Experimental design table with nrow=ncol(table)
# Returns:
# Prints to stdout:
################
ExtractGroupFromMap <- function(map=NULL, column=NULL, group=NULL, verbose) {
  map <- as.data.frame(FilterMap(map=map, model=column))
  group <- unlist(strsplit(group, split=':'))
  if (ncol(map) != length(column)) {
    PrintMsg('"error":"Unable to determine groups for fold-change analysis. Make sure no - or : character is present in the mapping file."'
             , verbose)
  }
  keep <- 1
  for (i in 1:ncol(map)) {
    keep <- keep*(map[, i] == group[i])
  }
  return(keep)
}

################
# Analyse changes (fold-changes, p-values etc.)
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) map        (data-frame) Experimental design table with nrow=ncol(table)
#  (3) model      (character vector) A formula representing the model for stats. Terms
#                 must refer to names(map)
#  (4) json       (character) Json string specifying packages
#  (5) verbose    (character) Print messages? see PrintMsg() options
# Returns:
#  Figure data as a json string
# Prints to stdout:
#  A description of the function
################
AnalyseChange <- function(table=NULL, map=NULL,
                          stats=NULL, model=NULL,
                          json=libJson, verbose=TRUE,
                          graphical=FALSE) {

  PrintMsg('"description":"This is a differential analysis (fold-changes and statistical tests)."',
           verbose)
  # Calculate statistics
  if (is.null(model)) {
    model <- paste(names(map), sep='+')
  }
  nmodel <- length(model)
  data.json <- c(1:nmodel)
  for (i in 1:nmodel) {
    if (length(stats) != length(model)) {
      method = stats[1]
    } else {
      method = stats[i]
    }
    nrow <- nrow(table)
    effect.json <- list()
    v <- verbose
    graphic.data <- list()
    for (j in 1:nrow) {
      stat <- ComputeStats(response=as.vector(unlist(table[j, ])), map=map,
                           method=method, model=model[i], pairwise=TRUE,
                           verbose=v)$pairwise

        effect.names <- names(stat)
        neffect <- length(effect.names)
        for (k in 1:neffect) {
          if (j == 1 && k == 1) {
            graphic.data[[effect.names[k]]] <- list()
          }
          p <- unlist(stat[[k]][, ncol(stat[[k]])])
          if (length(effect.json) == 0) {
            effect.json[[effect.names[k]]] <- list()
          }
          comp.names <- row.names(stat[[k]])
          ncomp <- length(comp.names)
          for (l in 1:ncomp) {
            if (j == 1 && l == 1) {
              graphic.data[[effect.names[k]]][[comp.names[l]]] <- data.frame(logfc=c(1:nrow), ab=c(1:nrow))
              row.names(graphic.data[[effect.names[k]]][[comp.names[l]]]) <- row.names(table)
            }
            if (length(effect.json[[effect.names[k]]]) == 0) {
              effect.json[[effect.names[k]]][[comp.names[l]]] <- list()
              effect.json[[effect.names[k]]][[comp.names[l]]] <- c(1:nrow)
            }
            group.names <- unlist(strsplit(row.names(stat[[k]])[l], split='-'))
            if (length(group.names) != 2) {
              PrintMsg('"error":"Unable to determine groups for fold-change analysis. Make sure no - or : character is present in the mapping file."', verbose)
            }

            group1 <- ExtractGroupFromMap(map=map, column=names(stat)[k], group=group.names[1], verbose)
            group2 <- ExtractGroupFromMap(map=map, column=names(stat)[k], group=group.names[2], verbose)

            fc <- ComputeFoldChange(as.vector(unlist(table[j, group1 == 1])),
                                    as.vector(unlist(table[j, group2 == 1])),
                                    names=group.names,
                                    verbose=v)

            effect.json[[effect.names[k]]][[comp.names[l]]][j] <- paste('{"mean abundance":"',
                                                                        fc$ab,
                                                                        '","log2(fold-change)":"',
                                                                        fc$logfc,
                                                                        '","-log2(p-value)":"',
                                                                        -log2(p[l]),
                                                                        '"}',
                                                                        sep='')
            graphic.data[[effect.names[k]]][[comp.names[l]]]$logfc[j] <- fc$logfc
            graphic.data[[effect.names[k]]][[comp.names[l]]]$ab[j] <- fc$ab
          }
        }
        v <- FALSE
      }

      for (k in 1:length(effect.json)) {
        for (l in 1:length(effect.json[[k]])) {
          effect.json[[k]][[l]] <- paste('"',
                                         names(effect.json[[k]])[l],
                                         '":[',
                                         paste(effect.json[[k]][[l]], collapse=','),
                                         ']',
                                         sep='')
          if (graphical == TRUE) {
            plot(graphic.data[[k]][[l]]$ab,
                 graphic.data[[k]][[l]]$logfc,
                 main=names(effect.json[[k]])[l],
                 xlab='mean abundance',
                 ylab='log2(fold-change)')
          }
        }
        effect.json[[k]] <- paste('"',
                                  names(effect.json)[k],
                                  '":{',
                                  paste(effect.json[[k]], collapse=','),
                                  '}',
                                  sep='')
      }


      data.json[i] <- paste('"',
                            model[i],
                            '":{',
                            paste(effect.json, collapse=','),
                            '}',
                            sep='')
    }

  return(paste('{"data":{',
               paste(data.json, collapse=','),
               '},"names":["',
               paste(row.names(table), collapse='","'),
               '"]}',
               sep=''))

}

################
# Build a heatmap of abundances
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) map        (data-frame) Experimental design table with nrow=ncol(table)
#  (3) model      (character vector) A formula representing the model for stats. Terms
#                 must refer to names(map)
#  (4) metadata   (numeric dataframe) Metadata table
#  (5) fun        (character) Function to use in hierarchical clustering
#  (6) json       (character) Json string specifying packages
#  (7) verbose    (character) Print messages? see PrintMsg() options
#  (8) graphical  (logical) Generate graphics?
# Returns:
#  Figure data as a json string
# Output to device:
#  A figure
# Prints to stdout:
#  A description of the function
################
BuildHeatMap <- function(table=NULL, map=NULL, stats='anova',
                         model=NULL, secondary=NULL,
                         fun='spearman',
                         json=libJson, verbose=TRUE, graphical=TRUE) {

  suppressMessages(library('gplots'))

  PrintMsg('"description":"This is a heat-map of abundances."',
           verbose=verbose)

  # Check that there is no constant data
  RemoveConstantRows(table=table, verbose=TRUE)

  if ((nrow(table) < 3) || (ncol(table) < 3)) {
    PrintMsg('"error":"Not enough data to draw a heatmap (min 3 rows and 3 columns)."', TRUE, TRUE)
  }

  # Center/scale by row
  data <- as.data.frame(Transpose(apply(table, 1, cScale)))

  names(data) <- names(table)
  row.names(data) <- row.names(table)
  PrintMsg('"description":"Abundances are scaled on standard deviation and centered on mean per row."',
           verbose=verbose)

  # keep only columns of map that are used in the model
  map <- FilterMap(map=map, model=model)

  # Set function for hierarchical clustering
  DistFun <- function(x) {
    return (ComputeDistance(table=x,
                            fun=fun,
                            json=json,
                            verbose=FALSE))
  }

  if (graphical == FALSE) {
    pdf(file = NULL)
  }
    # Set the color palette
    col <- colorRampPalette(c("navy", "seashell", "red2"))(n=51)

    heatmap.out <- heatmap.2(as.matrix(data),
                scale='row',
                na.rm=TRUE,
                Rowv=TRUE,
                Colv=TRUE,
                dendrogram='both',
                #distfun=DistFun,
                col=col,
                symm=FALSE,
                symkey=FALSE,
                key=TRUE,
                keysize=1.5,
                density.info='density',
                trace='none',
                labCol=names(data),
                labRow=row.names(data),
                cexCol=0.2+1/log10(ncol(data)),
                mar=c(5, 10))

  if (graphical == FALSE) {
    dev.off()
  }

  # Order data according to dendrogram
  data <- data[heatmap.out$rowInd, ]
  data <- data[, heatmap.out$colInd]
  names <- names(map)
  map <- as.data.frame(map[heatmap.out$colInd, ])
  names(map) <- names
  if (!is.null(secondary)) {
    secondary <- secondary[, heatmap.out$colInd]
  }

  # Store heatmap data into a json string
  ncol <- ncol(data)
  heatmap.json <- c(1:ncol)
  data.names <- names(data)
  for (i in 1:ncol) {
    heatmap.json[i] <- paste('{"name":"',
                             data.names[i],
                             '","value":["',
                             paste(data[, i], collapse='","'),
                             '"]}',
                             sep='')
  }

  # Add categories to topbar
  topbar.json <- list()
  ncateg <- ncol(map)
  category.json <- c(1:ncateg)
  categ.names <- names(map)


  for (i in 1:ncateg) {
    category.json[i] <- paste('{"name":"',
                              categ.names[i],
                              '","value":["',
                              paste(map[, i], collapse='","'),
                              '"]}',
                              sep='')
  }
  topbar.json[['category']] <- paste('"category":[',
                                paste(category.json, collapse=','),
                                ']',
                                sep='')


  # Add p-values to sidebar
  sidebar.json <- list()

  if (is.null(model)) {
    model <- paste(names(map), sep='+')
  }

    nmodel <- length(model)
    stat.json <- c(1:nmodel)
    for (i in 1:nmodel) {
      if (length(stats) != length(model)) {
        method = stats[1]
      } else {
        method = stats[i]
      }
      nrow <- nrow(data)
      v <- verbose
      p.value <- list()
      for (j in 1:nrow) {
        stat <- ComputeStats(response=as.vector(unlist(data[j, ])), map=map,
                             method=method, model=model[i], pairwise=FALSE,
                             verbose=v)$summary

        stat.rownames <- row.names(stat)[row.names(stat) != 'Residuals']
        stat <- as.data.frame(stat[row.names(stat) != 'Residuals', ])

        nstat <- nrow(stat)
        for (k in 1:nstat) {
          if (is.null(p.value[[stat.rownames[k]]])) {
            p.value[[stat.rownames[k]]] <- c(1:nrow)
          }
          p.value[[stat.rownames[k]]][j] <- stat[k, ]
        }
        v <- FALSE
      }
      for (j in 1:length(p.value)) {
        p.value[[j]] <- paste('{"name":"',
                              names(p.value)[j],
                              '","value":["',
                              paste(p.value[[j]], collapse='","'),
                              '"]}',
                              sep='')
      }
      stat.json[i] <- paste('"',
                            model[i],
                            '":[',
                            paste(p.value, collapse=','),
                            ']',
                            sep='')
    }

  sidebar.json[['p-values']] <- paste('"p-values":{',
                                 paste(stat.json, collapse=','),
                                 '}',
                                 sep='')

  # Add correlations with secondary dataset to sidebar
  if (! is.null(secondary)) {

    PrintMsg('"description":"The correlations between the primary and secondary datasets were calculated using the Spearman rank correlation."',
             verbose=verbose)

    correlation <- as.data.frame(cor(x=t(data), y=t(secondary), use='na.or.complete', method ="spearman"))

    ncor <- ncol(correlation)
    cor.json <- c(1:ncor)
    for (i in 1:ncor) {
      cor.json[i] <- paste('{"name":"',
                           names(correlation)[i],
                           '","value":["',
                           paste(correlation[, i], collapse='","'),
                           '"]}',
                           sep='')
    }
    sidebar.json[['correlations']] <- paste('"correlations":[',
                             paste(cor.json, collapse=','),
                             ']',
                             sep='')
  }


  data.json <- paste('{"heatmap":[',
                     paste(heatmap.json, collapse=','),
                     '],"colnames":["',
                     paste(names(data), collapse='","'),
                     '"],"rownames":["',
                     paste(row.names(data), collapse='","'),
                     '"],"topbar":{',
                     paste(topbar.json, collapse=','),
                     '},"sidebar":{',
                     paste(sidebar.json, collapse=','),
                     '},"colDendrogram":',
                     dendrogram2json(heatmap.out$colDendrogram)[[1]],
                     ',"rowDendrogram":',
                     dendrogram2json(heatmap.out$rowDendrogram)[[1]],
                     '}',
                     sep='')

  return (data.json)
}

################
# Get the groups with the highest mean
# Args:
#  (1) data     (numeric vector) The data
#  (2) map      (data-frame) Experimental design table with nrow=length(data)
#  (3) model    (character) A formula representing the model for stats. Terms
#               must refer to names(map)
#  (4) verbose  (character) Print messages? see PrintMsg() options
# Returns:
#  A character vector with length=numer of terms in model
# Prints to stdout:
#  A description of the function
################
getGroupWithHighestMean <- function(data=NULL, map=NULL, column=NULL, verbose=TRUE) {

  PrintMsg('"description":"Determine groups with highest mean abundance."',
           verbose=verbose)

  map <- as.data.frame(map[, unlist(strsplit(column, split=':'))])
  if (ncol(map) == 1) {
    names(map) <- column
  }

  group <- as.data.frame(unique(map))
  if (ncol(group) == 1) {
    names(group) <- column
  }

  mean <- c(1:nrow(group))
  for (i in 1:nrow(group)) {
    keep <- 1
    for (j in 1:ncol(map)) {
      keep <- keep*(map[, j] %in% group[i, names(map)[j]])
    }
    mean[i] <- mean(unlist(data[as.logical(keep)]))
  }
  out <- list()
  out$value <- max(mean)
  out$id <- paste(unlist(group[which(mean == max(mean)), ]), collapse=':')
  out$group <- apply(group, 1, paste, collapse=':')

  return (out)
}

################
# Build a network of correlations for variables
# Args:
#  (1) table      (numeric dataframe) Count table
#  (2) map        (data-frame) Experimental design table with nrow=ncol(table)
#  (3) model      (character) A formula representing the model for stats. Terms
#                 must refer to names(map)
#  (4) metadata   (numeric dataframe) Metadata table
#  (5) fun        (character) Distance, correlation or similarity function
#  (6) json       (character) Json string specifying packages
#  (7) verbose    (character) Print messages? see PrintMsg() options
# Returns:
#  Figure data as a json string
# Prints to stdout:
#  A description of the function
################
BuildCorrelationNetwork <- function(table=NULL, map=NULL, stats='anova',
                                    model=NULL, secondary=NULL, fun='spearman',
                                    json=libJson, verbose=TRUE) {

  spec <- as.data.frame(do.call('rbind', json$correlation))
  spec <- spec[spec$value == fun, ]
  pkg <- unlist(strsplit(as.character(unlist(spec$pkg)), split=','))
  package <- ''
  if (length(pkg) > 0) {
    for (i in 1:length(pkg)) {
      suppressMessages(library(pkg[i], character.only=TRUE))
    }
    package <- paste(' (R package {', unlist(spec$pkg), '})', sep='')
  }

  PrintMsg(paste('"description":"This is a correlation network. It was built using ',
                        spec$label, package, '."', sep=''),
                        verbose=verbose)

  suppressMessages(library(igraph))


  # keep only columns of map that are used in the model
  map <- FilterMap(map=map, model=model)

  # Combine with secondary dataset
  data <- rbind(table, secondary)
  data.type <- rep('primary dataset', nrow(data))
  if (!is.null(secondary)) {
    data.type[(nrow(table)+1):nrow(data)] <- "secondary dataset"
  }

  # Check that there is no constant data
  RemoveConstantRows(table=data, verbose=TRUE)

  if ((nrow(data) < 3) || (ncol(data) < 3)) {
    PrintMsg('"error":"Not enough data to compute a network (min 3 rows and 3 columns)."', TRUE, TRUE)
  }

  # Calculate the correlation matrix
  weight <- ComputeCorrelation(table=data, fun=fun, test=TRUE,
                      json=json, verbose=FALSE)

  nmodel <- length(model)
  nnodes <- nrow(data)
  node.json <- c(1:nnodes)
  link.json <- c(1:(nnodes*(nnodes/2-1)))
  l <- 1
  legend.json <- list()
  for (i in 1:nnodes) {
    model.json <- c(1:nmodel)
    for (j in 1:nmodel) {
      stat <- ComputeStats(response=as.vector(unlist(data[i, ])), map=map,
                           method=stats, model=model[j], pairwise=FALSE,
                           verbose=FALSE)$summary
      neffect <- length(row.names(stat)[row.names(stat) != 'Residuals'])
      effect.json <- c(1:neffect)
      if (length(legend.json[[model[j]]]) == 0) {
        legend.json[[model[j]]] <- c(1:neffect)
      }
      for (k in 1:neffect) {
        gwhm <- getGroupWithHighestMean(data=data[i, ], map=map, column=row.names(stat)[k], verbose=FALSE)
        effect.json[k] <- paste('"',
                              row.names(stat)[k],
                              '":{"p-value":"',
                              stat[k, ],
                              '","highest-mean":"',
                              gwhm$id,
                              '"}',
                              sep='')
        if (i == 1) {
          legend.json[[model[j]]][k] <- paste('"',
                                              row.names(stat)[k],
                                              '":["',
                                              paste(gwhm$group, collapse='","'),
                                              '"]',
                                              sep='')
        }
      }
      model.json[j] <- paste('"',
                             model[j],
                             '":{',
                             paste(effect.json, collapse=','),
                             '}',
                             sep='')
      if (i == 1) {
        legend.json[[model[j]]] <- paste('"',
                                         model[j],
                                         '":{',
                                         paste(legend.json[[model[j]]], collapse=','),
                                         '}',
                                         sep='')
      }
    }
    node.json[i] <- paste('{"id":"',
                          i-1,
                          '","name":"',
                          row.names(data)[i],
                          '","data-type":"',
                          data.type[i],
                          '","stat":{',
                          paste(model.json, collapse=','),
                          '},"mean":"',
                          mean(unlist(data[i, ])),
                          '","min":"',
                          min(unlist(data[i, ])),
                          '","max":"',
                          max(unlist(data[i, ])),
                          '"}',
                          sep='')
    if (i < nnodes) {
      for (j in (i+1):nnodes) {
        link.json[l] <- paste('{"source":"',
                               i-1,
                               '","target":"',
                               j-1,
                               '","weight":"',
                               weight$estimate[i, j],
                               '","p-value":"',
                               weight$p.value[i, j],
                               '"}',
                               sep='')

        l <- l+1
      }
    }
  }

  return (paste('{"nodes":[',
                paste(node.json, collapse=','),
                '],"links":[',
                paste(link.json, collapse=','),
                '],"legend":{',
                paste(unlist(legend.json), collapse=','),
                '}}',
                sep=''))

}

################
# Build a network of similarity for samples
# Args:
#  (1) tables   (list of numeric dataframes)
#  (2) map      (data-frame) Experimental design table with nrow=ncol(table)
#  (3) model    (character) A formula representing the model for stats. Terms
#               must refer to names(map)
#  (4) funs     (list of characters) Distance or similarity functions
#  (5) clust    (character) Network clustering algorithm
#  (6) json     (character) Json string specifying packages
#  (7) verbose  (character) Print messages? see PrintMsg() options
#  (8) lib      (character) Path to holynet library
# Returns:
#  List [1] json string (fusion network) [2] data-frame (clusters) 
# Prints to stdout:
#  A description of the function
################
BuildSimilarityNetwork <- function(table=NULL, map=NULL, funs=NULL,
                                   clust="walktrap", clust.names=NULL,
                                   json=libJson, verbose=TRUE,
                                   lib='holynetlib.R') {
  source(lib)

  spec <- as.data.frame(do.call('rbind', json$distance))
  for (i in 1:length(table)) {
    fun <- funs[1]
    if ((length(funs) == length(table)) && (length(funs) > 1)) {
      fun <- funs[i]
    }
    spec <- spec[spec$value == fun, ]
    pkg <- unlist(strsplit(as.character(unlist(spec$pkg)), split=','))
    package <- ''
    if (length(pkg) > 0) {
      for (j in 1:length(pkg)) {
        suppressMessages(library(pkg[j], character.only=TRUE))
      }
      package <- paste(' (R package {', unlist(spec$pkg), '})', sep='')
    }

    PrintMsg(paste('"description":"This is a similarity network. It was built using ',
             spec$label, package, '."', sep=''),
             verbose=verbose)
  }

  # Calculate similarity matrices
  mat <- list()
  for (i in 1:length(table)) {
    fun <- funs[1]
    if (length(funs) == length(table)) {
      fun <- funs[i]
    }
    mat[[i]] <- CreateAdjacencyMatrix(CreateSimilarityMatrix(table[[i]], fun))
  }

  # If multiple matrices exist, fuse them
  if (length(mat) > 1) {
    fusmat <- FuseMatrices(mat)
    if (is.null(fusmat)) {
      PrintMsg('"error":"Trying to fuse matrices but dimensions are not matching."', TRUE, TRUE)
    }
    mat[[(length(mat)+1)]] <- fusmat
  }

  out <- list()

  # Compute clustering on similarity matrices
  if (!is.null(clust) && (clust != 'none')) {

    spec <- as.data.frame(do.call('rbind', json$graph_clustering))
    spec <- spec[spec$value == clust, ]
    pkg <- unlist(strsplit(as.character(unlist(spec$pkg)), split=','))
    package <- ''
    if (length(pkg) > 0) {
      for (i in 1:length(pkg)) {
        suppressMessages(library(pkg[i], character.only=TRUE))
      }
      package <- paste(' (R package {', unlist(spec$pkg), '})', sep='')
    }

    PrintMsg(paste('"description":"Clusters were determined using the ',
                          spec$label, package, '."', sep=''),
                          verbose=verbose)

    clusters <- matrix(ncol=length(mat), nrow=nrow(mat[[1]]))
    for (i in 1:length(mat)) {
      clusters[, i] <- paste(clust,
                             as.character(ApplyNetworkClustering(CreateNetwork(mat[[i]]), clust_method=clust)),
                             sep='')
    }
    clusters <- as.data.frame(clusters)
    if (!is.null(clust.names)) {
      names(clusters) <- clust.names
    }
    out[['txt']] <- clusters
    map <- cbind(map, clusters)
  }

  # Pack data into a json string
  json.data <- buildFusionNetworkJson(mat, map)

  out[['json']] <- json.data
  return (out)
}

#################################
#        (\/)(°,,,°)(\/)        #
#################################
libJson <- ReadJson()

