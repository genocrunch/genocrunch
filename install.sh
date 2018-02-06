#!/usr/bin/env bash
#install.sh
# Generic script to install through bash profile

################
# Error function
################
err() {
  echo "Error [${__base}]: $@" >&2
  exit 1
}

################
# Main
# Optional args:
#  (1) action  Valid choices: 'install', 'uninstall'. Default: 'install'.
################
main(){
  local funcname
  funcname='main'

  # Set action (install or uninstall)
  local value
  value=('install' 'uninstall')
  local action
  action="${value[0]}"
  if [[ "${#@}" -gt 0 ]]; then
    [[ ! " ${value[@]} " =~ " ${1} " ]] && err "in ${funcname}() (line ${LINENO}): unknown value to action (${1}). Valid choice: ${value[@]}. Default:${value[0]}."
    [[ "${1}" == "${value[1]}" ]] && action="${1}"
  fi

  local bash_profile
  if [[ -e "${HOME}"/.bashrc ]]; then
    bash_profile="${HOME}"/.bashrc
  elif [[ -e "${HOME}"/.bash_profile ]]; then
    bash_profile="${HOME}"/.bash_profile
  else
    err "in ${funcname}() (line ${LINENO}): no .bashrc or .bash_profile found in \$HOME."
  fi
  [[ ! -w "${bash_profile}" ]] && err "in ${funcname}() (line ${LINENO}): write permission denied on ${bash_profile}."

  local append_str
  append_str="export PATH=\"${__installdir}:\$PATH\""

  if [[ "${action}" == 'install' ]]; then
    if [[ $(grep -c "${append_str}" "${bash_profile}") -eq 0 ]]; then
      echo "${append_str}" >> "${bash_profile}"
      echo "Appending '${append_str}' to ${bash_profile}..."
    else
      echo "'${append_str}' alredy found in ${bash_profile}. Nothing to do."
    fi
  else
    if [[ $(grep -c "${append_str}" "${bash_profile}") -ne 0 ]]; then
      # !!! Hard coded !!!
      sed -i -e '\&^'"export PATH=\\\"${__installdir}:\\\$PATH\\\""'$&d' "${bash_profile}"
      echo "Removed '${append_str}' from ${bash_profile}."
    else
      echo "'${append_str}' not found in ${bash_profile}. Nothing to do."
    fi
  fi

  return 0
}

set -o nounset
set -o pipefail

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__basedir="$(basename ${__dir})"
#__basedir="$(echo "${__basedir}" | sed -e "s/-[0-9]*\.[0-9]*$//g")"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file})"
__installdir="${__dir}"/lib/genocrunch_console/bin

main "${@}"

exit 0
