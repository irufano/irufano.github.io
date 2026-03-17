---
title: "Generative AI Key Concepts"
date: "2024-09-24"
description: "Machine learning is a subset of AI that involves developing algorithms that allow computers to learn from & make predictions or decisions based on data."
author: "irufano"
tags:
  - AI
  - Generative AI
image: "https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/main/01-introduction-to-genai/images/AI-diagram.png"
---

## Definition

Generative AI refers to a type of artificial intelligence that creates new content, such as images, text, audio, or even video, based on patterns and data it has learned. What makes it a fantastic technology is that it democratizes AI, anyone can use it with as little as a text prompt, a sentence written in a natural language. There's no need for you to learn a language like Java or SQL to accomplish something worthwhile, all you need is to use your language, state what you want and out comes a suggestion from an AI model. The applications and impact for this is huge, you write or understand reports, write applications and much more, all in seconds.

After decades of research in the AI field, a new model architecture – called Transformer – overcame the limits of RNNs, being able to get much longer sequences of text as input. Transformers are based on the attention mechanism, enabling the model to give different weights to the inputs it receives, ‘paying more attention’ where the most relevant information is concentrated, regardless of their order in the text sequence.

Most of the recent generative AI models – also known as Large Language Models (LLMs), since they work with textual inputs and outputs – are indeed based on this architecture. What’s interesting about these models – trained on a huge amount of unlabeled data from diverse sources like books, articles and websites – is that they can be adapted to a wide variety of tasks and generate grammatically correct text with a semblance of creativity. So, not only did they incredibly enhance the capacity of a machine to ‘understand’ an input text, but they enabled their capacity to generate an original response in human language.

## How do large language models work?

### Tokenization

Large Language Models receive a text as input and generate a text as output. However, being statistical models, they work much better with numbers than text sequences. That’s why every input to the model is processed by a tokenizer, before being used by the core model. A token is a chunk of text – consisting of a variable number of characters, so the tokenizer's main task is splitting the input into an array of tokens. Then, each token is mapped with a token index, which is the integer encoding of the original text chunk.

![image](https://github.com/irufano/generative-ai-for-beginners/raw/main/01-introduction-to-genai/images/tokenizer-example.png?WT.mc_id=academic-105485-koreyst)

### Predicting output tokens

Given n tokens as input (with max n varying from one model to another), the model is able to predict one token as output. This token is then incorporated into the input of the next iteration, in an expanding window pattern, enabling a better user experience of getting one (or multiple) sentence as an answer. This explains why, if you ever played with ChatGPT, you might have noticed that sometimes it looks like it stops in the middle of a sentence.

### Selection process

The output token is chosen by the model according to its probability of occurring after the current text sequence. This is because the model predicts a probability distribution over all possible ‘next tokens’, calculated based on its training. However, not always the token with the highest probability is chosen from the resulting distribution. A degree of randomness is added to this choice, in a way that the model acts in a non-deterministic fashion - we do not get the exact same output for the same input. This degree of randomness is added to simulate the process of creative thinking and it can be tuned using a model parameter called temperature.

## Custom Knowledge Base

To add a knowledge base to an OpenAI-powered chatbot or application, you can use a variety of approaches depending on how dynamic and structured you want your knowledge base to be. Here are some common methods:

###  Embedding Knowledge with Fine-Tuning
- **Fine-tuning**: You can fine-tune the OpenAI model on your specific knowledge base or domain. This involves training the model on a custom dataset (such as product information, FAQs, internal documents) to improve its responses.
  - Steps:
    - Collect data (e.g., text documents, structured data).
    - Format it into the proper input-output pairs (prompts and completions).
    - Fine-tune the model using OpenAI's fine-tuning API.
- **Use case**: Best for cases where knowledge is mostly static and doesn’t change often.

### Use Knowledge Base API and Dynamic Retrieval

- **External APIs**: Integrate the chatbot with a real-time knowledge base, such as a MySQL database, content management system, or external API.
  - **Method**: Implement a retrieval mechanism that allows the chatbot to fetch answers from your dynamic database based on user queries. For instance, using vector embeddings to match user queries with the most relevant content in the database.
  - **Tools**: You can use libraries like langchain to facilitate this process, creating a pipeline that pulls data dynamically based on user input.
- **Use case**: Useful when your knowledge base is large, changes frequently, or needs to handle complex queries.

### Contextual Knowledge with Prompts

- **Long prompts with context**: You can inject specific information about your knowledge base directly into the prompt as context.
  - **Method**: Before each query, construct a detailed prompt that includes relevant information from your knowledge base, which the model will use to provide context-aware answers.
  - **Use case**: Best for handling small sets of information or specific queries where the information needed is known beforehand.

### Augmenting with Vector Databases (e.g., Pinecone, FAISS)

- **Vector search**: Store your knowledge base as embeddings in a vector database (like Pinecone, Weaviate, or FAISS). When a user asks a question, convert it to a vector, search for the most relevant knowledge entry, and use the result as part of the answer.
  - **Method**: Convert text to embeddings using OpenAI or other models, and retrieve the most similar data points in response to a user query.
  - **Use case:** Perfect for large datasets where similarity search is required to find relevant answers.

### Hybrid Approach with LangChain and FastAPI

- LangChain: LangChain enables building large language model (LLM) applications that can dynamically interact with databases and external systems. It helps set up a chatbot that can fetch data from knowledge bases like databases, APIs, and even web pages.
  - Steps:
    1. Store Knowledge: Define a knowledge base, which could be a SQL database, document store, or API.
    2. Query Execution: Use an LLM with the LangChain framework to query the knowledge base dynamically.
    3. FastAPI Integration: Combine this with FastAPI for serving the chatbot with dynamic knowledge retrieval.

### Document Retrieval with Plugins or Middleware

- OpenAI Plugins: If you're using OpenAI in an application, consider building or using a plugin or middleware that acts as a bridge to your knowledge base. For example, retrieving documents, querying databases, or even triggering workflows (e.g., customer support tickets) based on the query.
- Use case: Ideal for more complex enterprise solutions, where OpenAI can function alongside existing systems.

### Hybrid QA Pipelines (LLM + Traditional Search)

- **Combining LLMs with traditional search**: You can combine the capabilities of language models with traditional search mechanisms like Elasticsearch or other keyword-based systems.
  - **Method**: First, use search engines to retrieve relevant documents, and then pass those documents to OpenAI for processing and summarization.
  - **Use case**: Works well in applications where quick retrieval from a large corpus of documents is needed, and then those documents are summarized or clarified by the LLM.