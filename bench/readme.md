## $

Reference: https://ecss.io/appendix1.html.

1000 items are being added to HTML:

```html
  <div class="tagDiv wrap1">
    <div class="tagDiv layer1" data-div="layer1">
      <div class="tagDiv layer2">
        <ul class="tagUl">
          <li class="tagLi"><b class="tagB"><a href="/" id="a" name="a" class="tagA link" data-select="link">Select</a></b></li>
        </ul>
      </div>
    </div>
  </div>
```

Comparing time spent on initializing selectors:

   | `spect@20` | `spect@19` | `vanilla` | `selector-observer` | `regular-elements` | `insertionQuery` | `mutation-summary` | `qso`
---|---|---|---|---|---
`#a`                   |
`[name=a]`             |
`.link`                |
`a`                    |
`div a`                |
`div ul a`             |
`*`                    |
`[data-select]`        |
`a[data-select]`       |
`[class^="wrap"]`      |
`[data-select="link"]` |
`a[data-select="link"]`|
`div[data-div="layer1"] a[data-select="link"]`|
`.tagA.link`|
`.tagUl .link`|
`.tagB > .tagA`|
`.div:nth-of-type(1) a`|
`.div:nth-of-type(1) .div:nth-of-type(1) a`|
`div.tagDiv > div.tagDiv.layer2 > ul.tagUL > li.tagLi > b.tagB > a.tagA.link`|
`.tagLi .tagB a.TagA.link`|

hasInitialDelay


## h

`vanilla` | `spect@20` | `spect@19` | `hyperscript` | `incremental-dom` | `lit-html` | `htl` | `react` | `preact/htm` | `uhtml`
---|---|---|---|---|---|---





