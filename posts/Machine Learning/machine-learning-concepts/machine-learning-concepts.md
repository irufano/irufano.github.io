---
title: "Machine Learning Key Concepts"
date: "2024-09-17"
description: "Machine learning is a subset of AI that involves developing algorithms that allow computers to learn from & make predictions or decisions based on data."
author: "irufano"
tags:
  - Machine Learning
image: "https://ogrisel.github.io/scikit-learn.org/sklearn-tutorial/_images/plot_ML_flow_chart_12.png"
---

## Definition

Machine learning (ML) is a subset of artificial intelligence (AI) that involves developing algorithms that allow computers to learn from and make predictions or decisions `based on data`. Instead of being explicitly programmed to perform tasks, machine learning models `identify patterns` in data and improve their performance as they are exposed to more data over time.

## Traditional Programming VS ML

### Traditional Programming

Traditional programming is a manual process—meaning a person (programmer) creates the program. But without anyone programming the logic, one has to manually formulate or code rules.

> [note]: **Traditional Programming**
> INPUT + PROGRAM = OUTPUT

### Machine Learning
In machine learning, on the other hand, the algorithm automatically formulates the rules from the data.

> [note]: **Machine Learning**
> INPUT + OUTPUT = PROGRAM (Model)

## Rules for Using ML

There are 3 rules that are needed when we are going to use machine learning. One is mandatory and the other 2 are optional.

### Data

Data is mandatory rule. When we use machine learning, ensure we have `data`, specially `historical data` because machine learning is learned from experience, where one of the experiences is historical data. Once we have data we can probably use machine learning.

### Pattern (Optional)

We must know that the problems we face have a `pattern`. One form of machine learning is pattern recognition. Once we know that the problem has pattern we can probably use machine learning, but if the problem has random stuff is can be hard to use machine learning.

### The problem cannot be derived mathematically (Optional)

When we use machine learning it is better the problem `can't be derived mathematically`. If the problem can be derived mathematically then actually the problem can be programmed explicitly, example determining odd-even numbers etc. But there are problem that have pattern and can't be derived mathematically, example disease detection, desease detection cannot be derived into mathematic formula.


## Machine Learning Type

### Supervised Learning

In supervised learning, the algorithm is trained on a dataset that contains both input features (data) and corresponding output labels (desired results). So in supervised learning requires `data` and `labels` as input. There are 2 types of supervised learning `Classification` and `Regression`.

Characteristics of Supervised Learning:

1. **Labeled Data**: The training data includes input-output pairs. Each example in the dataset comes with a label or outcome. For example:     
   - Input: Features like height, weight, and age.
   - Output: A label like "healthy" or "unhealthy" for a health prediction model.

2. **Goal**: The algorithm tries to minimize the difference between its predicted outputs and the actual outputs by finding the best mapping from inputs to outputs during training.

3. **Training Process**: 
   - The model is fed with a labeled dataset (both input features and output labels).
   - The model makes predictions and compares them to the actual labels.
   - Based on this comparison, the model adjusts its internal parameters to improve accuracy.
   - This process repeats until the model achieves satisfactory performance on the training data.

#### Classification

> [note]: F(X) => [0,1] 
> 
> *or*
> 
> F(X) => [0,1,2,...]

- The goal is to assign data points to predefined `categories` or `classes`.
- **Binary Classification**: Two possible classes (e.g., spam vs. non-spam emails).
- **Multi-class Classification**: More than two classes (e.g., classifying types of flowers into species).
- **Examples**:
  - Diagnosing diseases as “positive” or “negative”.
  - Credit Scoring as "accepted" or "rejected"
  - Classifying whether a customer will churn or stay.

#### Regression

> [note]: F(X) => R

- The goal is to predict continuous values (`numerical outcomes`).
- **Examples**:
  - Predicting house prices based on features like size and location.
  - Forecasting stock prices.
  - Predicting the temperature at a specific location.

#### Supervised learning model pipeline

![Supervised learning models](https://ogrisel.github.io/scikit-learn.org/sklearn-tutorial/_images/plot_ML_flow_chart_12.png)
<p class="text-sm">Image by: <a class="no-underline" href="https://ogrisel.github.io/scikit-learn.org/sklearn-tutorial/tutorial/text_analytics/general_concepts.html#supervised-learning-model-fit-x-y">scikit-learn</a></p>

### Unsupervised Learning

Unsupervised learning is a type of machine learning where the model is trained on data that has no labeled outcomes. Unlike supervised learning, where the goal is to map inputs to specific labels, unsupervised learning focuses on uncovering the underlying structure or patterns within the data. The primary objective is to discover hidden relationships or groupings without human intervention or guidance.
Included in unsupervised learning are clustering, Dimensionality Reduction etc.

Characteristic of Unsupervised Learning:
1. **No Labels**: The data used in unsupervised learning is not labeled. The model works on its own to detect patterns, clusters, or associations without predefined categories or answers.
2. **Exploratory**: It’s primarily used for data exploration to find patterns, groupings, or structures in the data.
3. **Unstructured Data**: Often applied to unstructured or unlabeled datasets, such as customer purchase data, social media activity, or image datasets.

#### Clustering

- The goal is to `group data points` into clusters such that items in the same group are more similar to each other than to those in other groups.
  
- **Examples**: 
  - Grouping customers based on purchasing behavior to create customer segments for targeted marketing.
  - Clustering desease

#### Dimensionality Reduction

- The goal is to `reduce the number of features` (or dimensions) in the data while retaining the most important information. This can help visualize high-dimensional data or improve the performance of machine learning models.

- **Example**: Reducing the number of variables in a gene expression dataset from thousands to a smaller, more manageable set of features.
  
#### Association

- The goal is to find `relationships between variables` in large datasets. It’s commonly used in market basket analysis to find items that frequently appear together in transactions.

- **Example**: Identifying that customers who buy bread often buy butter as well.

#### Anomaly Detection

- The goal is to identify `outliers or unusual data points` that do not conform to the expected pattern. This can be critical in fields like fraud detection or predictive maintenance.

- **Example**: Detecting fraudulent credit card transactions based on deviations from normal spending behavior.

#### Unsupervised learning model pipeline

![Unsupervised learning models](https://ogrisel.github.io/scikit-learn.org/sklearn-tutorial/_images/plot_ML_flow_chart_32.png)
<p class="text-sm">Image by: <a class="no-underline" href="https://ogrisel.github.io/scikit-learn.org/sklearn-tutorial/tutorial/text_analytics/general_concepts.html#unsupervised-learning-model-fit-x">scikit-learn</a></p>


### Reinforcement Learning

Reinforcement Learning (RL) is a type of machine learning in which an agent learns to make decisions by interacting with an environment in order to `maximize a reward`. Unlike supervised or unsupervised learning, reinforcement learning does not rely on labeled datasets or direct supervision. Instead, the agent `learns through trial and error`, receiving feedback in the form of rewards or penalties for actions it takes.

Applications of Reinforcement Learning:
- **Game AI**: RL has been used to achieve superhuman performance in games like chess (AlphaZero), Go, and video games (e.g., Atari, Dota 2). Algorithms like Deep Q-Networks (DQN) and AlphaGo have demonstrated the power of RL in strategic decision-making.

- **Robotics**: RL is widely used in robotics for tasks like navigation, manipulation, and locomotion, where robots learn to interact with the physical environment through trial and error.

- **Autonomous Vehicles**: Self-driving cars use reinforcement learning to make decisions about navigation, lane changing, and collision avoidance in dynamic, unpredictable environments.

- **Healthcare**: RL

#### The Reinforcement Learning Process
1. **Initialization**: The agent starts in an initial state and does not know how the environment works.

2. **Action Selection**: The agent selects an action based on its current policy.

3. **Transition**: The action changes the state of the environment.

4. **Reward**: The agent receives feedback (a reward) from the environment.

5. **Learning**: Based on the reward, the agent updates its knowledge (usually the value function or policy) to improve future actions.

6. **Repeat**: The process continues, with the agent learning and adapting its strategy over time to maximize cumulative rewards.
