---
title: WSL, Git, Mircosoft Terminal 等常用工具配置
description: 记录开发过程中一些工具的常用配置，加速在新环境上的准备效率。工具包括不限于微软 Linux 子系统 Ubuntu (WSL, WSL2), Git, 微软最新发布的命令行神器( Mircosoft Terminal )等。
date: '2019-12-03 00:30:00'
tags:
  - 百宝箱
book: history
status: done
draft: false
cover: awesome-config/wsl.jpg
---

## Git

### 用户与鉴权

```bash
# 生成SSH公钥对
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 配置用户名和邮箱
git config --global user.name <username>
git config --global user.email <email@example.com>

# 针对 https 协议的仓库，记住密码，避免每次都要求输入密码
git config --global credential.helper store

# 自动拉取 submodule
git config --global submodule.recurse true
```

### alias 提高效率

```bash
git config --global alias.co checkout
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.br branch
git config --global alias.logg "log --graph --decorate --all"
```

配置了 alias，就可以简化相应的 Git 命令，例如 `git status` 可以简化为 `git st`

Git 的 `git log` 并不能显示其他的分支，以及分支之间的树形关系，所以额外添加很多的参数，因此，适合用 `git logg` 这么一个别名来代替。


<details>
<summary>对比一下`git log` 和 `git logg` 的差异。</summary>
<div>


`git log` 不能够显示分支之间的树形关系，`git logg`可以。

```bash
commit 68b7f2f13b73cfdaeadc022eb02181714449186c (HEAD -> master, origin/master, origin/HEAD)
Author: geektutu <geektutu@example.com>
Date:   Mon Nov 25 00:08:01 2019 +0800

    fix title

commit b65de90b15ef78c12b2ac9346520c873504b361c
Author: geektutu <geektutu@example.com>
Date:   Mon Nov 25 00:01:13 2019 +0800

    add quick rust
```

```bash
$ git logg
* commit 68b7f2f (HEAD -> master, origin/master, origin/HEAD)
| Author: geektutu <geektutu@example.com>
| Date:   Mon Nov 25 00:08:01 2019 +0800
|
|     fix title
|
| * commit 01dfa04 (origin/dependabot/npm_and_yarn/lodash-4.17.15)
|/  Author: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>
|   Date:   Sun Nov 24 16:01:47 2019 +000
```

结合 `--oneline` 参数很方便地浏览提交记录。

```bash
$ git logg --oneline
* 68b7f2f (HEAD -> master, origin/master, origin/HEAD) fix title
| * 01dfa04 (origin/dependabot/npm_and_yarn/lodash-4.17.15) Bump lodash from 4.17.11 to 4.17.15
|/
| * 387e6da (origin/dependabot/npm_and_yarn/lodash.merge-4.6.2) Bump lodash.merge from 4.6.1 to 4.6.2
|/
| * 32a2929 (origin/dependabot/npm_and_yarn/mixin-deep-1.3.2) Bump mixin-deep from 1.3.1 to 1.3.2
|/
* b65de90 add quick rust
* 228f94a update comments.js
...
```

</div>
</details>

## WSL (Ubuntu)

Windows 10 下内置了微软Linux子系统(Windows Subsystem for Linux, WSL)，对于使用 Windows 作为主力开发的童鞋们，生产力可以得到极大的解放。

### 安装

- 第一步，在 PowerShell (管理员权限) 中以命令行方式开启 Linux 特性，并**重启**。

```bash
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

- 第二步，在微软应用商店(Microsoft Store)搜索 Ubuntu 并安装。

> 命令行方式或离线安装请参考：[WSL Install - Microsoft](https://docs.microsoft.com/en-us/windows/wsl/install-win10)

### 配置

- 权限问题

第一个问题，磁盘挂载到Linux下时，所有的权限都被变为了 777，如果需要保持 Linux 下的习惯（文件夹 755，文件644），则需要额外配置 `/etc/wsl.conf`。

`vim /etc/wsl.conf`，添加如下配置，这样在 Windows 中新建文件夹和文件，将以 755/644 的权限创建：

```conf
[automount]
options = "metadata,umask=22,fmask=11"
```

第二个问题，WSL 中创建文件夹和文件，仍旧是 777 的权限，因为 WSL 的 umask 默认值为 `0000`，需要修改为`0022`：

`vim ~/.profile`，添加

```bash
umask 0022
```

修改完上述两个文件，并不会即时生效，需要执行以下命令关闭 WSL 服务，再重新打开。 

在 *cmd* 中执行 `wsl -t Ubuntu` 或在 *PowerShell* 执行 `Restart-Service LxssManager`

`wsl -t <DistributionName>`，中的 DistributionName 可以通过 `wsl -l` 查询到

```bash
C:\Users\admin>wsl -l
适用于 Linux 的 Windows 子系统:
Ubuntu (默认)
```

附：如果在 Visual Studio Code (VS Code) 中 使用了 Remote - WSL 打开 WSL 中的文件夹，会发现 `umask 0022` 仍没有生效，在 VS Code 中创建的文件夹权限仍旧是 777，则需要将`umask 0022`添加到`~/.vscode-server/server-env-setup`（不存在则新建）中。VS Code 连接 WSL 时会执行该脚本，可以用以下命令快速添加，重新启动 VS Code 即可生效。

```bash
echo "umask 0022" | tee -a ~/.vscode-server/server-env-setup
```

> 参考：[WSL Config - Microsoft](https://docs.microsoft.com/en-us/windows/wsl/wsl-config)
> 参考: [Updates to wsl.conf no longer immediate - Github](https://github.com/microsoft/WSL/issues/3994)

## Mircosoft Terminal

微软新开发的命令行程序，可以算是良心之作了，同样可以在 Microsoft Store 中搜索安装。支持多页签切换，支持选择不同的 Shell，结合 WSL 使用，显示效果也非常棒。

`Ctrl + ,` 可以打开配置文件(json 格式)，也可以点击下拉框中的 `Settings`。

- 第一步，将 defaultProfile 的值修改为 WSL 的 guid，这样默认打开就是 WSL 的 Shell 了。

- 第二步，为了让 Terminal 的快捷键和 Linux 更接近，还可以设置快捷键。

```json
"keybindings": [
    {
        "command": "closeTab",
        "keys": ["ctrl+w"]
    },
    {
        "command": "newTab",
        "keys": ["ctrl+t"]
    },
    {
        "command": "paste",
        "keys": ["shift+insert"]
    }
],
"copyOnSelect": true // 选中即复制
```

默认的快捷键：

```bash
ctrl + tab # 切换标签页
ctrl + shift + c # 复制
ctrl + shift + v # 粘贴
ctrl + shift + 1/2/3 # 打开 powershell/cmd/WSL
```

新增快捷键：

```bash
ctrl + w # 关闭当前标签页
ctrl + t # 新增标签页
shift + insert # 粘贴
copyOnSelect # 选中即复制
```

> 参考 [Terminal SettingsSchema - Github](https://github.com/microsoft/terminal/blob/master/doc/cascadia/SettingsSchema.md)

**待更新**
