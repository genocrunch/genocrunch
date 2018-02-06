#!/usr/bin/env bash
#modify_table.sh
# Generic script to modify a table

################
# Main
# Args:
#  (1) table_fp  Path to comma-delimited txt table (1st row as header)
#  (2) method  Method tu apply for table modification
#  (3) category  Name of the column in 'table_fp' that contains data category
#  (4) map_fp  Path to mapping file
#  (5) factor  Name of the column in 'map_fp' that contains sorting factor
#  (6) output_fp  Path to output file
################
main() {

  local funcname
  funcname='main'

  local table_fp
  table_fp="${1}"
  [[ ! -e "${table_fp}" ]] && err "in ${funcname}() cannot find ${table_fp}"

  local method
  method="${2}"

  if [[ "${method}" == 'check_dataset' ]]; then
    local category_column
    category_column="${3}"
    local map_fp
    map_fp="${4}"
    local sample_name
    sample_name="${5}"
  elif [[ "${method}" == 'table2R' ]]; then
    local output_fp
    output_fp="${3}"
  elif [[ "${method}" == 'aggregate' ]]; then
    local category_column
    category_column="${3}"
    local level
    level="${4}"
    local fun
    fun="${5}"
    local output_fp
    output_fp="${6}"
  else
    err "in ${funcname}() wrong argument to method (2): ${method}"
  fi

  # Modify table
  if [[ "${method}" == 'check_dataset' ]]; then
    verify_format "${table_fp}" "${category_column}" "${map_fp}" "${sample_name}"
  elif [[ "${method}" == 'check_map' ]]; then
    verify_map_format "${table_fp}"
  elif [[ "${method}" == 'table2R' ]]; then
    remove_comments "${table_fp}" "${output_fp}"  # remove any comment lines at the begining of the table and the 1st element of the 1st line
  elif [[ "${method}" == 'aggregate' ]]; then
    aggregate_by_category_level "${table_fp}" "${category}" "${level}" "${fun}" "${output_fp}"
  fi

  return 0
}

set -o nounset
set -o pipefail
#set -o xtrace

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")"  && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file})"
__lib="${__dir}"/../lib
source "${__lib}"/genocrunchlib.sh
__user=$(basename "${HOME}")
__workingdir="$(pwd)"
[[ ! -w "${__workingdir}" ]] && err "(line ${LINENO}) write permission denied on ${__workingdir}"
__roottmp=/tmp
if ([[ ! -d "${__roottmp}" ]] || [[ ! -w "${__roottmp}" ]]) ; then
  __roottmp="${__dir}"/../tmp
  [[ ! -d "${__roottmp}" ]] && { mkdir "${__roottmp}" ; [[ "$?" -ne 0 ]] && \
  err "(line ${LINENO}) cannot make ${__roottmp}" ; }
fi
tmpdir=$(mktemp -d "${__roottmp}"/"$(basename ${__file} .sh)"XXX)
trap 'rm -rf "${tmpdir}"' EXIT  # makes sure tmpdir is deleted when exit
[[ ! -d "${tmpdir}" ]] && { mkdir "${tmpdir}" ; [[ "$?" -ne 0 ]] && \
err "(line ${LINENO}) cannot make ${tmpdir}" ; }
[[ ! -w "${tmpdir}" ]] && err "(line ${LINENO}) write permission denied on ${tmpdir}"
chown "${__user}" "${tmpdir}"

main "${@}"

exit 0
