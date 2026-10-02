---
layout: blog-post.html
title: GitHub classroom with classR
date: 2026-10-03
author: Cristian Román
description: >
  classR runs a course on GitHub from R. No GitHub Classroom needed. Each
  student gets a private repo in your organization, your starter files are
  pushed in, and the student is added as a collaborator.
image: /assets/images/blog/github-classroom-v0-8w4yzvbuxavo4n8uv3zoxubyeuyknqvhgdazjd4vdj4.webp
tags:
  - blog
---
## Before you start

Make the organization first. The GitHub API cannot create one, so set it up once in the browser. You also need git on your system to collect submissions. You do not need to add every student to the organization prior to following this tutorial. Once the repo gets created for the student, they will have control over the files in the repo.

You will need a roster, which if effectively a CSV with one column named `handle`:

```
handle

student1
student2
student3
```

## Install classR

The package is currently available only from GitHub. Use the following lines in R to install it:

```
install.packages("remotes")
remotes::install_github("datadiversitylab/classR")
```

## One-time token setup

Please run this only once. It opens the token page with the right scopes selected, checks the token works and carries `repo` and `admin:org`, then saves it to `~/.Renviron`. If a scope is missing, it tells you which and does not save anything.

```r
library(classR)
setup_github_token()
```

## Set the organization

Do this each session, with your own organization (which you should create from GitHub and should be associated with the account configured with git in your machine).

```r
set_org("ISTA421INFO521")
```

## Assign a homework

Put your starter files in a folder, then push them to everyone. Each repo is named `prefix-handle`, so `hw1-student1` and so on.

```r
res <- assign_homework("roster.csv", "hw1_files", prefix = "hw1")
table(res$status)
```

`res` has one row per student, with a status of `ok`, `exists`, `create_error`, or `setup_error`. Existing repos are skipped. This means that you can rerun this safely. Only the errors will need your attention:

```r
res[res$status %in% c("create_error", "setup_error"), ]
```

Students get `push` access by default. Use `permission = "admin"` if you want them managing their own repos.

## Check who is set up

```r
status <- check_homework("roster.csv", prefix = "hw1")
status[!status$exists, ]
```

## Update starter files (optional)

If you need to fix or add a file after assigning, push it again. Missing files are created, existing ones overwritten.

```r
update_homework("roster.csv", "hw1_fixes", prefix = "hw1")
```

This overwrites whatever is at those paths. If a student already edited a file you push, your version replaces theirs in the latest commit, though the old content stays in history as its own commit. To be safe, I would recommend you to point the folder at only the files students are not meant to touch.

## Collect submissions

Pull everyone's work into a local folder. Submissions are saved to `dest/prefix/handle`. Run it again later to pull new commits.

```r
collect_homework("roster.csv", prefix = "hw1", dest = "submissions")
```

## Tips

* Files are pushed through the GitHub contents API, one file per commit. This approach is fine for small starter folders but very slow for large or nested projects. 
* Collecting uses git, since it moves whole repositories. 
* Adding a collaborator sends an invitation, which students should accept from their GitHub email or notifications before they can push.
