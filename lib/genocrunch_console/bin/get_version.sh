#!/usr/bin/env bash
#get_version.sh
# Get version of R packages used in R scripts

################
# Main
################
main(){
  local funcname
  funcname='main'

  local fps
  fps=($(cd .. && git ls-files '*.R' | sed 's/^/..\//g'))

  # Get packages hard-coded in R scripts
  grep -hE "(require|library)\([a-zA-Z0-9\']*\)" "${fps[@]}" | \
  sed '/^[[:space:]]*#/d' | \
  sed -r "s/.*(require|library)\(([a-zA-Z0-9\']*)\).*/\2/" | \
  sed "s/[\']*//g" | \
  sort -u

  return 0
}

set -o nounset
set -o pipefail

main "${@}"

exit 0
