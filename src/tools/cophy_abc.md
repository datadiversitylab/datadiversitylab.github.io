---
Name: cophy_ABC
authors:
  - Yichao Zeng
Description: >-
  This project presents an Approximate Bayesian Computation (ABC) approach to
  estimating speciation and extinction rates from cophylogenetic systems. The
  rates of four types of speciation and two types of extinction can be inferred:
  host speciation (λH), symbiont speciation without host switching (λS),
  cospeciation (λC), symbiont speciation with host switching (λW), host
  extinction (μH), and symbiont extinction (μS). The speciation and extinction
  rates follow:


  μH=ϵH(λH+λC)


  μS=ϵS(λS+λC+λW)


  where ϵH and ϵS range between 0 and 1.


  We define the net diversification rate of the cophylogeny as


  r=2∗rhost∗rsymbiontrhost+rsymbiont


  where host=λH+λC−μH and symbiont=λS+λC+λW−μS are the net diversification rates of the host and symbiont clades, respectively.


  For the user's information, some parameters are assigned a different name in the code: λW - `exp_H`, ϵH - `mu_H_frac`, and ϵS - `mu_S_frac`.


  The tutorial provided here is the full procedure to estimate macroevolutionary rates from a given cophylogeny, using the BLenD-a / BLenD-b curves and tree sizes as summary statistics. This procedure is illustrated with a re-analysis of the cophylogenetic dataset from Van Dam et al. (2024)
github: https://github.com/yichaozeng/cophy_ABC
link: https://academic.oup.com/sysbio/advance-article/doi/10.1093/sysbio/syag070/8789437
image: /assets/images/tools/tools-and-data.png
topics:
  - Biodiversity
  - Data Science
tags:
  - R package
---
