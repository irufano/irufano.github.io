---
title: "Insight Posts Documentation"
date: "2024-09-15"
description: "Documentation about insight post creation with markdown include meta data, section, paragraph etc."
author: "irufano"
tags:
  - Markdown
---

Documentation about insight post creation with markdown. Use markdown for post, below the complete documentation:

## Meta Data

Meta data used in this post are `title`, `date`, `description`, `author` and `tags`. Title at this meta data used for title post. 

```js title="your-post.md"
---
title: "Your Post Title"
date: "2024-09-15"
description: "Your post description"
author: "author"
tags:
  - your tag
  - other tag
---
```

## Paragraph

To create paragraph on post same like create paragraph as text.

```md title="your-post.md"
<!-- first paragraph -->
Commodo eu in adipisicing id eu elit nisi exercitation ipsum mollit cupidatat consequat non. Aute elit nulla sit ipsum pariatur do do esse culpa laboris. Officia est non reprehenderit adipisicing officia deserunt consectetur aute exercitation magna laboris ipsum ut. Veniam reprehenderit Lorem commodo et adipisicing dolor Lorem commodo do incididunt. Id tempor culpa laborum eiusmod est veniam. Officia fugiat mollit dolor adipisicing tempor voluptate proident qui.

<!-- second paragraph -->
Laboris nulla et amet fugiat. Sit amet ad quis in consequat esse incididunt velit est nulla. Irure exercitation excepteur eiusmod mollit ea aute ut qui exercitation aliquip ipsum cupidatat. Sint anim cillum velit magna aliqua officia eu eu reprehenderit tempor aliqua veniam dolore duis. Qui sunt mollit qui exercitation nulla in ullamco fugiat esse cupidatat officia. Eu ipsum enim velit tempor magna ea dolor sint Lorem.
```

## Image

To add image on post, you must put image on public directory, then access it on post with 

```md title="your-post.md"
![Alt text for the image](/yourpath_image.png)
```

## Section

The section will show on the right of the post. The section that will show only `##` and the `###`.

```md title="your-post.md"
## Section 1

Eiusmod sint laborum nostrud aliquip excepteur reprehenderit id in aliqua.

### Section 1.1

Nisi veniam et fugiat nostrud nulla incididunt ut eiusmod eiusmod ex velit sunt Lorem.

## Section 2

Pariatur magna sit pariatur in sit ex quis nulla nostrud ipsum proident cillum et et.

## Section 2.1
Excepteur dolor dolor pariatur dolore exercitation.
```

## Bullet and Numbering
To create bullet and numbering you can use `-` or `^[0-9]+$` for numbering.

```md title="your-post.md"
- bullet 1
- bullet 2
- bullet 3

1. number 1
2. number 2
3. number 3
```

- bullet 1
- bullet 2
- bullet 3

1. number 1
2. number 2
3. number 3

## Emphasis 
To create emphasis on post like *this is emphasis*. We can use `*` between word or sentence.

```md title="your-post.md"
*This is emphasis*

*Hello*

*Good Morning*
```

## Strong
To create strong text on post like **this is strong**. We can use `**` between word or sentence.

```md title="your-post.md"
**This is strong**

**Hello**

**Good Morning**
```

## Code
### Inline Code
To create inline code on post like `this is inline code`. We can use **`** between word or sentence.

```md title="your-post.md"
`This is inline code`

`Hello`

`Good Morning`
```

### Code Block
To create code block on post. Follow the example below:

```markdown title="your-post.md"
'```js title="your-code-title.js"
funtion getData () => {
    console.log("Hello world!");
}
```'

<!-- remove ' -->
```

## Blockquote

### Info

```markdown title="your-post.md"
> [info]:
>
> this is info blockquote example
```
output:

> [info]:
>
> this is info blockquote example

### Warning

```markdown title="your-post.md"
> [warning]:
>
> this is warning blockquote example
```
output:

> [warning]:
>
> this is warning blockquote example

### Tip

```markdown title="your-post.md"
> [tip]:
>
> this is tip blockquote example
```
output:

> [tip]:
>
> this is tip blockquote example

### Important

```markdown title="your-post.md"
> [important]:
>
> this is important blockquote example
```
output:

> [important]:
>
> this is important blockquote example

### caution

```markdown title="your-post.md"
> [caution]:
>
> this is caution blockquote example
```
output:

> [caution]:
>
> this is caution blockquote example

### Note

Note block is doesn't have title header.

```markdown title="your-post.md"
> [note]:
>
> this is note blockquote example
```
output:

> [note]: This is note *blockquote* `example`
>
> Cillum adipisicing sint cupidatat mollit duis.
>
> Tempor proident veniam est veniam minim minim consectetur cupidatat Lorem cupidatat adipisicing. Ea ipsum excepteur pariatur non cupidatat amet exercitation enim id fugiat officia nostrud. Velit laboris laboris qui labore dolore fugiat mollit in laborum labore Lorem.
>
>
> ```js title="your-code-title.js"
> funtion getData () => {
>    console.log("Hello world!");
> }
> ```