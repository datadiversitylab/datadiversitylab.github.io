---
publicationTitle: Bayesian Additive Regression Networks
publicationAuthor: Danielle Van Boxel
publicationDate: "2024"
publicationMonth: Mar
publicationType: arXiv
publicationAbstract: We apply Bayesian Additive Regression Tree (BART)
  principles to training an ensemble of small neural networks for regression
  tasks. Using Markov Chain Monte Carlo, we sample from the posterior
  distribution of neural networks that have a single hidden layer. To create an
  ensemble of these, we apply Gibbs sampling to update each network against the
  residual target value (i.e. subtracting the effect of the other networks). We
  demonstrate the effectiveness of this technique on several benchmark
  regression problems, comparing it to equivalent shallow neural networks, BART,
  and ordinary least squares. Our Bayesian Additive Regression Networks (BARN)
  provide more consistent and often more accurate results. On test data
  benchmarks, BARN averaged between 5 to 20 percent lower root mean square
  error. This error performance does come at the cost, however, of greater
  computation time. BARN sometimes takes on the order of a minute where
  competing methods take a second or less. But, BARN without cross-validated
  hyperparameter tuning takes about the same amount of computation time as tuned
  other methods. Yet BARN is still typically more accurate.
tags:
  - Data science
image: /assets/images/publications/barn.jpg
pdfDocument: /assets/documents/publications/2404.04425.pdf
webLink: https://arxiv.org/abs/2404.04425
---
