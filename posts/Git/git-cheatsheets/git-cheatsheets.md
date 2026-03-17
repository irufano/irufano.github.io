---
title: "Git Cheatsheet"
date: "2024-11-01"
description: "Git cheatsheet commonly used daily"
author: "irufano"
tags:
  - Git
  - Cheatheets
image: "https://git-scm.com/images/logos/2color-lightbg@2x.png"
---

## List commit
```sh
git log -n [number] 

# or use --oneline for simple logs
git log -n [number] --oneline
```

## Rebase

```sh
git rebase [branch base]

# rebase n commit from head
git rebase -i HEAD~n


# rebase the root of commit (the first commit)
git rebase -i --root
```

## Cherry-pick

```sh
git cherry-pick [commit-hash]

# or multi commit
git cherry-pick [commit-hash] [commit-hash] [commit-hash] 
```

## Stash

```sh
git stash

# stash include untracked file
git stash --include-untracked

# list stash
git stash list

# pop stash
git stash pop stash@{n}

# apply stash but keep stash log
git stash apply stash@{n)

# remove specific stash
git stash drop stash@{n}
```

## Rename Branch
### local
```sh
git branch -m <new_name>
# or
git branch -m <old_name> <new_name>
```
### remote
```sh
git branch -m <new_name>
# or
git branch -m <old_name> <new_name>

# Then push the <new_name> local branch and reset the upstream branch
git push origin -u <new_name>

# Then delete the <old_name> remote branch and finish!
git push origin --delete <old_name>
```

## Tag
```sh
# add tag local
tag -a [TAGE_NAME] -m "[TAGE_MESSAGE]"

# push tag to remote
git push origin [TAGE_NAME]

# remove tag local
git tag -d [TAGE_NAME]

# remove tag remote
git push -d origin [TAGE_NAME]

# To get the most recent tag
git describe --tags --abbrev=0

# To get the most recent tag, with the number of additional commits on top of the tagged object & more
git describe --tags 

# To get the most recent annotated tag
git describe --abbrev=0

```

## Edit last commit date
```sh
git commit --amend --no-edit --date "12/30/2024 10:19:19 +0700" 
```