---
title: TensorFlow入门(二) - mnist手写数字识别(模型保存加载)
description: TensorFlow 入门系列文章，第二篇，mnist手写数字识别(模型保存加载)。
date: '2017-12-17 11:51:24'
tags:
  - 机器学习
  - TensorFlow
  - mnist
  - Python
book: history
status: done
draft: false
cover: /post/tensorflow-mnist-save-ckpt/save_ckpt.png
---

这篇文章是 **TensorFlow Tutorial** 入门教程的第二篇文章。

上一篇文章[TensorFlow入门(一) - mnist手写数字识别(网络搭建)](http://geektutu.com/post/tensorflow-mnist-simplest.html)介绍了`神经网络输入`、`输出`、`独热编码`、`损失函数`等最基本的知识，并且演示了如何用最简单的模型实现mnist手写数字识别91%的正确率。但是遗留的问题是，模型保存在内存中，每次都得重新开始训练。

这篇文章解决的就是这个问题。将依次介绍tensorflow中如何`保存`已经训练好的模型，如何在某个训练步数的基础上`继续训练`，最后将演示如何`加载模型`，并借助pillow(Python2中称为PIL)库实现真实手写数字图片的识别。

## 模型的保存
- 首先看一下项目的目录结构

```
|--mnist/
  |--data_set/ 训练以及测试数据集
  |--test_images/  多张测试图片
    |--0.png
    |--1.png
    |--4.png
  |--v2/  
    |--ckpt/ 模型保存在这里！！！
    |--model.py  网络模型
    |--train.py  训练代码
    |--predict.py  预测代码
```
### 第一步更改模型，记录global_step

> 每一次训练，会进行一次梯度下降，传入的global_step的值会自增1，因此，可以通过计算global_step这个张量的值，知道当前训练了多少步。

```python
# model.py
class Network:
    def __init__(self):
        # 记录已经训练的次数
        self.global_step = tf.Variable(0, trainable=False)

        # ... 中间省略网络结构

        # minimize 可传入参数 global_step， 每次训练 global_step的值会增加1
        # 因此，可以通过计算self.global_step这个张量的值，知道当前训练了多少步
        self.train = tf.train.GradientDescentOptimizer(0.001).minimize(
            self.loss, global_step=self.global_step)
```

### 第二步，每隔N步保存

```python
CKPT_DIR = 'ckpt' # 定义模型存储的位置
net = Network()
sess = tf.Session()
sess.run(tf.global_variables_initializer())

# tf.train.Saver是用来保存训练结果的。
# max_to_keep 用来设置最多保存多少个模型，默认是5
# 如果保存的模型超过这个值，最旧的模型将被删除
saver = tf.train.Saver(max_to_keep=10)

train_step = 10000 # 总的训练次数10000
step = 0 # 记录训练次数, 初始化为0
save_interval = 1000 # 每隔1000步保存模型

while step < train_step:
    # ...省略训练代码

    step = sess.run(net.global_step)
    # 模型保存在ckpt文件夹下
    # 模型文件名最后会增加global_step的值，比如1000的模型文件名为 model-1000
    if step % save_interval == 0:
        saver.save(sess, CKPT_DIR + '/model', global_step=step)
```

- 最终保存的模型如下所示

> 假设训练到了2000步，保存了2次模型。ckpt文件夹下会生成7个文件，第一个文件是 checkpoint文件，保存了所有的模型的路径。其中第一行代表当前的状态，即在加载模型时，使用哪一个模型是由第一行决定的。

> 每个模型包含3个文件，分别是 
> 1. model-xxx.data-00000-of-00001
> 2. model-xxx.index
> 3. model-xxx.meta

checkpoint文件
```
model_checkpoint_path: "model-2000"
all_model_checkpoint_paths: "model-1000"
all_model_checkpoint_paths: "model-2000"
```

目录结构

```
|--v2/  
  |--ckpt/ 模型保存在这里！！！
    |--checkpoint
    |--model-1000.data-00000-of-00001
    |--model-1000.index
    |--model-1000.meta
    |--model-2000.data-00000-of-00001
    |--model-2000.index
    |--model-2000.meta
  |--model.py  网络模型
  |--train.py  训练代码
  |--predict.py  预测代码
```

## 加载模型与继续训练(train.py)
> 假设我们当前模型已经训练到了2000步，但是由于某种原因停止了。那么是否可以在2000步的基础上继续训练呢？

- 只需一步，训练前保存的模型restore到session中即可。这里需要注意的是，创建 `tf.train.Saver`对象一定要在创建`tf.Session`之后。


```python
CKPT_DIR = 'ckpt'
net = Network()
sess = tf.Session()
sess.run(tf.global_variables_initializer())
saver = tf.train.Saver(max_to_keep=10)

train_step = 10000
step = 0
save_interval = 1000

# 开始训练前，检查ckpt文件夹，看是否有checkpoint文件存在。
# 如果存在，则读取checkpoint文件指向的模型，restore到sess中。
ckpt = tf.train.get_checkpoint_state(CKPT_DIR)
if ckpt and ckpt.model_checkpoint_path:
    saver.restore(sess, ckpt.model_checkpoint_path)
    # 读取网络中的global_step的值，即当前已经训练的次数
    step = sess.run(net.global_step)
    print('Continue from')
    print('        -> Minibatch update : ', step)

while step < train_step:
    # ...省略训练代码
```

- 再次运行代码，将打印出

```
Continue from
        -> Minibatch update :  2000
第 3000步，...
```

- 如果将checkpoint文件的第一行改为如下，训练将从1000开始，再次训练到2000时，会将原来的2000的模型覆盖。所以restore哪一个模型，只与checkpoint的第一行有关，即只与`model_checkpoint_path`有关。
```
model_checkpoint_path: "model-1000"
```

```
Continue from
        -> Minibatch update :  1000
第 2000步，...
```

## 使用模型预测数字(predict.py)
### 第一步，restore模型
```python
import numpy as np
from PIL import Image


class Predict:
    def __init__(self):
        self.net = Network()
        self.sess = tf.Session()
        self.sess.run(tf.global_variables_initializer())
        self.restore() # 加载模型到sess中

    def restore(self):
        saver = tf.train.Saver()
        ckpt = tf.train.get_checkpoint_state(CKPT_DIR)
        if ckpt and ckpt.model_checkpoint_path:
            saver.restore(self.sess, ckpt.model_checkpoint_path)
        else:
            raise FileNotFoundError("未保存任何模型")

    def predict(self, image_path):
        # ...省略
```

### 第二步读入图片并预测
```python
class Predict:
    # ...
    
    def predict(self, image_path):
        # 读图片并转为黑白的
        img = Image.open(image_path).convert('L')
        flatten_img = np.reshape(img, 784)
        x = np.array([1 - flatten_img])
        y = self.sess.run(self.net.y, feed_dict={self.net.x: x})

        # 因为x只传入了一张图片，取y[0]即可
        # np.argmax()取得独热编码最大值的下标，即代表的数字
        print(image_path)
        print('        -> Predict digit', np.argmax(y[0]))
```

- test_images目录下的`0.png`，`1.png`，`4.png`三张图片的预测结果。
```python
app = Predict()
app.predict('../test_images/0.png')
app.predict('../test_images/1.png')
app.predict('../test_images/4.png')
```

### 最后的结果

- 第一次 **python train.py**
```
第 1000步，当前loss：26.94
第 2000步，当前loss：28.36
```
- 2000步时停止，第二次 **python train.py**
```
Continue from
        -> Minibatch update :  2000
第 3000步，当前loss：23.49
第 4000步，当前loss：20.40
第 5000步，当前loss：11.65
```

- **python predict.py**
```
../test_images/0.png
        -> Predict digit 0
../test_images/1.png
        -> Predict digit 1
../test_images/4.png
        -> Predict digit 4
```

> 源代码&数据集已上传到 [Github](https://github.com/geektutu/tensorflow-tutorial-samples)

**觉得还不错，不要吝惜你的[star](https://github.com/geektutu/tensorflow-tutorial-samples)，支持是持续不断更新的动力。**

## 附 推荐

- [一篇文章入门 Python](https://geektutu.com/post/quick-python.html)
