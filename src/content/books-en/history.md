---
# 英文版书目：title/description/outline 的 part 与 short 需翻译；
# 章节 slug 与中文版保持一致（URL 为 /en/post/<slug>.html），
# outline 中未翻译的章节会显示为 upcoming（不生成页面）。
id: history
title: 'Quick Guide'
description: >-
  Early posts from the Geektutu blog — quick-start tutorials, TensorFlow
  guides, data mining notes and the story of building this site. The English
  edition is translated incrementally; the Quick Start series (Go / Python /
  Rust) is available so far.
order: 100
featured: true
outline:
  - part: Quick Start · Go
    chapters:
      - quick-golang
      - quick-go-gin
      - quick-go2
      - quick-go-protobuf
      - quick-go-rpc
      - quick-go-wasm
      - quick-go-test
      - quick-gomock
      - quick-go-mmap
      - quick-go-context
  - part: Quick Start · Python
    chapters:
      - quick-python
  - part: Quick Start · Rust
    chapters:
      - quick-rust
  - part: TensorFlow Tutorials
    chapters:
      - tensorflow-mnist-simplest
      - tensorflow-mnist-save-ckpt
      - tensorflow-mnist-tensorboard-training
      - tensorflow-make-npy-hdf5-data-set
      - tensorflow2-mnist-cnn
      - tensorflow2-gym-nn
      - tensorflow2-gym-q-learning
      - tensorflow2-gym-dqn
      - tensorflow2-gym-pg
  - part: TensorFlow 2 Docs (Chinese)
    chapters:
      - slug: tf2doc
        short: Preface
      - slug: tf2doc-ml-basic-image
        short: Image Classification
      - slug: tf2doc-ml-basic-text
        short: Text Classification
      - slug: tf2doc-ml-basic-structured-data
        short: Structured Data Classification
      - slug: tf2doc-ml-basic-regression
        short: Regression
      - slug: tf2doc-ml-basic-overfit
        short: Overfitting & Underfitting
      - slug: tf2doc-ml-basic-save-model
        short: Save & Restore Models
      - slug: tf2doc-cnn-cifar10
        short: Convolutional Neural Network
      - slug: tf2doc-tfhub-image-tl
        short: Transfer Learning with TF Hub
      - slug: tf2doc-rnn-lstm-text
        short: RNN & LSTM
  - part: Data Mining
    chapters:
      - pandas-dataframe-series
      - pandas-select-data
      - pandas-cheat-sheet-zh-cn
  - part: Cheat Sheets
    chapters:
      - cheat-sheet-sqlite
  - part: Pandora's Box
    chapters:
      - box-tools
      - awesome-config
  - part: Year in Review
    chapters:
      - '2020'
  - part: Building This Blog
    chapters:
      - blog-experience-1
      - blog-experience-2
      - blog-experience-3
      - blog-experience-4
      - blog-experience-5
      - blog-experience-6
      - blog-experience-7
---
