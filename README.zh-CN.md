# dsh-desktop-titlebar

DSH Desktop 的标题栏插件，接管窗口顶部的标题栏。

它在窗口顶部画一条用应用自身配色渲染的栏，原生最小化 / 最大化 / 关闭按钮仍浮在
它上面，中间放两个操作：**新建会话** 和 **会话历史**。历史按钮会弹出一个列出当前
工作区会话的浮层，选中一条即可切换过去。

这条栏只在 Windows 上出现（桌面外壳会给文档加上 `data-windows-titlebar` 标记），
全屏时隐藏。按住栏拖动窗口仍然有效。

## 打包

```sh
pnpm install
pnpm build
```

`pnpm build` 生成 `lib/`，它是构建产物，不进版本库。

## 安装

有两种办法，用哪种都行。

### 办法一：项目里的脚本

```sh
pnpm run install:profile          # 装进 desktop（默认）
pnpm run install:profile web      # 装进 web
```

命令后面那个名字就是 profile 名，不写就是 `desktop`。

它做三件事：

1. 在 `~/.dsh/profiles/<名字>/package.json` 的 `dependencies` 里加一条链接，指向本目录；
2. 把本包的包名加进同一个文件的 `dsh.profile.bundles` 列表；
3. 在 profile 目录里跑一次 `pnpm install`，让那条链接变成真的模块。

### 办法二：dsh 命令

```sh
# 在本目录里执行
dsh plugin --profile web add .
```

`dsh plugin add` 干的是同一件事，而且依赖由它自己处理。但它不认 `desktop` 这个
profile —— 那个 profile 归 DSH Desktop 应用独占管理，命令会直接报错。所以装进
`desktop` 请用办法一。

两种办法重复执行都安全。装完重启 DSH Desktop 生效。

## 开发

```sh
pnpm check   # 类型检查、测试、打包、冒烟
```
