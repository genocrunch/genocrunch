#genocrunchlib.sh

################
# Error function
# Args:
#  (1)  Error message
# Global vars:
#  __base  script name
################
err() {
  echo "Error [${__base}]: $@" >&2
  exit 1
}

################
# Message function
# Args:
#  (1) categ  Message category (ex: 'title', 'log', 'output', 'fig')
#  (2) msg  Message
# Global vars:
#  __base  script name
# Prints to stdout:
#  'msg'
################
printmsg() {
  local categ
   categ="${1}"

  local msg
  msg="${2}"

  local time
  time=$(date +'%Y-%m-%d %X')

  printf "%s\t[%s]\t%s\t%s\n" "${__base}" "${time}" "${categ}" "${msg}"

  [[ "${msg}" == 'error' ]] && exit 1

  return 0
}

################
# Make a unique tmp directory
# Args:
#  (1) Name to be used as a base for the creation of the new tmp directory
# Prints to stdout:
#  The path to the created tmp diectory
################
mktmpdir() {
  local funcname
  funcname='mktmpdir'

  local roottmp=
  roottmp=/tmp
  if ([[ ! -d "${roottmp}" ]] || [[ ! -w "${roottmp}" ]]) ; then
    roottmp="$(pwd)"
  fi

  local tmpdir
  tmpdir=$(mktemp -d "${roottmp}"/"${1}"XXX)
  [[ ! -d "${tmpdir}" ]] && { mkdir "${tmpdir}" ; [[ "$?" -ne 0 ]] && \
  err "in ${funcname}() cannot create ${tmpdir}" ; }
  [[ ! -w "${tmpdir}" ]] && err "in ${funcname}() write permission denied on ${tmpdir}"
  echo "${tmpdir}"

  return 0
}

################
# Remove comments and 1st element of the 1st row in a BIOM-derived txt table
# Args:
#  (1) input_fp  Path to input file in txt format
#  (2) output_fp  Path to output file
# Outputs:
#  A modified version of 'input_fp'
################
remove_comments() {
  local funcname
  funcname='remove_comments'

  local input_fp
  input_fp="${1}"
  [[ ! -e "${input_fp}" ]] && err "in ${funcname}() cannot find ${input_fp}"

  local output_fp
  output_fp="${2}"

  if [[ "${input_fp}" != "${output_fp}" ]]; then
    cp "${input_fp}" "${output_fp}"
  fi

  local second_line_char
  second_line_char=$(awk < "${output_fp}" -F'\t' 'NR==2{print substr ($1, 1, 1)}')

  # Delete the first line until the second line does not start with "#"
  while [[ "${second_line_char}" = '#' ]]; do

    sed -i -e '1d' "${output_fp}"
    second_line_char=$(awk < "${output_fp}" -F'\t' 'NR==2{print substr ($1, 1, 1)}')
  done

  # Remove the 1st element of the 1st line
  awk < "${output_fp}" -F'\t' 'NR==1{for(i=2;i<=NF;i++)printf "\t%s",$i;print ""}NR>1{print $0}' > "${output_fp}".tmp && mv "${output_fp}".tmp "${output_fp}"

  return 0
}

################
# Test if a header is present in the first row of a table
# Args:
#  (1)  Table in txt format
#  (2)  Name of the column to test
# Returns:
#  0 if not present, column index if present
################
test_header() {
  local funcname
  funcname='test_header'

  local input_fp
  input_fp="${1}"  # set input table file path
  [[ ! -e "${input_fp}" ]] && err "in ${funcname}() cannot find ${input_fp}"

  local header
  header="${2}"

  awk < "${input_fp}" -v header="${header}" -F'\t' 'NR==1{coli=0;for(i=1;i<=NF;i++)if($i==header){coli=i;break};print coli}'

  return 0
}


################
# Aggregate TXT table (like BIOM-derived TXT table) by a specific column containing ;-delimited elements (such as taxonomic levels)
# Args:
# 1  TXT table (1st row as header)
# 2  Name of the column to use for aggregation
# 3  Level to use for aggregation (numeric value)
# 4  Function to use for data aggregation (sum, mean, ...)
# 5  Output file
################
aggregate_by_category_level() {
  local funcname
  funcname='aggregate_by_category_level'

  local tmpdir
  tmpdir=$(mktmpdir "${funcname}")

  local table_fp
  table_fp="${1}"
  [[ ! -e "${table_fp}" ]] && err "in ${funcname}() cannot find ${table_fp}"

  local category
  category="${2}"

  local level
  level="${3}"

  local fun
  fun="${4}"

  local output_fp
  output_fp="${5}"

  cp "${table_fp}" "${tmpdir}"/table.tmp

  if [[ "${category}" == 'false' ]]; then
    cp "${tmpdir}"/table.tmp "${output_fp}"
    rm -rf "${tmpdir}"
    return 0
  fi

  local category_index
  category_index=$(test_header "${tmpdir}"/table.tmp "${category}")  # get column index of the category

  if [[ "${category_index}" -eq 0 ]]; then
    printmsg 'warning' "in ${funcname}() no column named ${category} found in ${tmpdir}/table.tmp. First column will be used as category column by default.";
    cut -f1 "${table_fp}" | paste -d'\t' "${table_fp}" - > "${tmpdir}"/table.tmp
    awk < "${tmpdir}"/table.tmp -v category="${category}" -F'\t' 'NR==1{for(i=2;i<NF;i++){printf "\t%s",$i};printf "\t%s\n", category};NR>1{print $0}' > "${tmpdir}"/table.tmp.tmp && mv "${tmpdir}"/table.tmp.tmp "${tmpdir}"/table.tmp
    category_index=$(awk < "${tmpdir}"/table.tmp -F'\t' 'NR==1{print NF}');
  fi


  # Get category, change to 'Unknown' when needed and prune down to specified level
  cut -f1,"${category_index}" "${tmpdir}"/table.tmp  \
  | sed 's/^$/Unknown/g;s/^ $/Unknown/g;s/^ _*$/Unknown/g;s/^ [a-zA-Z]__$/Unknown/g;s/\t/;/g' \
  | awk -v level=$((${level}+1)) -v category_index="${category_index}" -F';' 'NR==1{print $NF}
                                   NR>1{
                                     if(NF == 1) {
                                       printf "%s\n",$2;
                                     } else {
                                       if(category_index == 1) {
                                         start=2;
                                         printf "%s",$1;
                                       } else {
                                         start=3;
                                         printf "%s",$2;
                                       }
                                       for(i=start;i<=level;i++){
                                         if($i=="" || $i==" " || $i~/^ _*$/ || $i~/^ [a-zA-Z]__$/){
                                           if (category_index != 1){
                                             printf "(%s)\n", $1;
                                           }
                                           break;
                                         }else{
                                           if(i==level){
                                             printf ";%s\n", $level;
                                             break;
                                           }else{
                                             printf ";%s", $i;
                                           }
                                         }
                                       }
                                     }
                                   }' \
  | paste -d'\t' "${tmpdir}"/table.tmp - \
  | awk -v category_index="${category_index}" -F'\t' 'NR==1{
                                                        for(i=2;i<=NF;i++){
                                                          if(i!=category_index){
                                                            printf "\t%s",$i;
                                                          };
                                                        };
                                                        print "";
                                                      };
                                                      NR>1{
                                                        printf "%s", NR;
                                                        for(i=2;i<=NF;i++){
                                                          if(i!=category_index){
                                                            printf "\t%s", $i;
                                                          };
                                                        };
                                                        print "";
                                                      }' > "${tmpdir}"/table.tmp.tmp && mv "${tmpdir}"/table.tmp.tmp "${tmpdir}"/table.tmp

  # Aggregate by category
  modify_table.R -t "${tmpdir}"/table.tmp --method 'aggregation' --aggr.col "${category}" --fun "${fun}" --level "${level}" -o "$(dirname "${output_fp}")"/"$(basename "${output_fp}")" # aggregate rows by row names

  rm -rf "${tmpdir}"
  return 0
}
