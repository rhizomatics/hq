#!/usr/bin/env bash
# Copy the admin workflow callers in templates/workflows into every rhizomatics repo
# checked out under a root directory (default ~/Projects), and remove the per-repo
# workflows and label files they replace. Only touches working trees; review and commit
# in each repo afterwards.
#
# A repo can opt out of templates with .github/admin-skip: one template file name per line
# (# comments allowed), e.g. admin-dependency-review.yml in a private repo without GitHub
# Advanced Security. Skipped templates are removed from the repo if present.
#
#   admin/sync-admin.sh [--check] [root]
#
# --check reports repos that are out of date and exits non-zero, changing nothing.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd) # admin/, which holds templates/
check=false
[[ ${1:-} == --check ]] && { check=true; shift; }
root=${1:-$HOME/Projects}

legacy=(
  .github/workflows/auto_assign_issue.yml
  .github/workflows/auto_assign_pr.yml
  .github/workflows/auto-assign.yml
  .github/workflows/labeller.yml
  .github/workflows/dependency-review.yml
  .github/labels.yml
  refresh-deps.sh
)

stale=0
while IFS= read -r gitdir; do
  repo=$(dirname "$gitdir")
  # Forks, retired and throwaway checkouts are not maintained repos
  [[ /${repo#"$root"/}/ =~ /(clones|archive|experiments)/ ]] && continue
  url=$(git -C "$repo" remote get-url origin 2>/dev/null || true)
  [[ $url =~ github\.com[:/]rhizomatics/ ]] || continue

  changes=()
  # Space-separated, not an array: macOS ships bash 3.2 (no mapfile, and `set -u` rejects empty arrays).
  skip=
  [[ -f $repo/.github/admin-skip ]] && skip=$(sed -e 's/#.*//' -e 's/[[:space:]]//g' -e '/^$/d' "$repo/.github/admin-skip" | tr '\n' ' ')
  for tpl in "$here"/templates/workflows/*.yml; do
    dest=$repo/.github/workflows/$(basename "$tpl")
    if [[ " $skip " == *" $(basename "$tpl") "* ]]; then
      [[ -e $dest ]] || continue
      changes+=("remove $(basename "$tpl") (admin-skip)")
      $check || rm "$dest"
      continue
    fi
    cmp -s "$tpl" "$dest" && continue
    changes+=("update $(basename "$tpl")")
    $check || { mkdir -p "$(dirname "$dest")"; cp "$tpl" "$dest"; }
  done
  # Shared mise file tasks: uv-managed Python repos get templates/python/tasks, npm repos
  # templates/node/tasks. A task the repo defines in its own mise.toml is left out, since
  # the file task would otherwise shadow it.
  eco=
  if [[ -f $repo/uv.lock ]]; then eco=python
  elif [[ -f $repo/package-lock.json ]]; then eco=node
  fi
  if [[ -n $eco ]]; then
    for tpl in "$here"/templates/$eco/tasks/*; do
      name=$(basename "$tpl")
      dest=$repo/.mise/tasks/$name
      grep -qE "^\[tasks\.\"?$name\"?\]" "$repo/mise.toml" 2>/dev/null && continue
      cmp -s "$tpl" "$dest" && continue
      changes+=("update .mise/tasks/$name")
      $check || { mkdir -p "$(dirname "$dest")"; cp "$tpl" "$dest"; }
    done
  fi
  # npm repos share one .npmrc, which holds the release cooldown for npm install/update.
  if [[ $eco == node ]] && ! cmp -s "$here/templates/node/npmrc" "$repo/.npmrc"; then
    changes+=("update .npmrc")
    $check || cp "$here/templates/node/npmrc" "$repo/.npmrc"
  fi
  for f in "${legacy[@]}"; do
    [[ -e $repo/$f ]] || continue
    changes+=("remove $f")
    $check || rm "$repo/$f"
  done

  if ((${#changes[@]})); then
    stale=1
    echo "${repo#"$root"/}:"
    printf '  %s\n' "${changes[@]}"
  else
    echo "${repo#"$root"/}: up to date"
  fi
done < <(find "$root" -maxdepth 4 -name .git -type d -prune | sort)

if $check && ((stale)); then exit 1; fi
