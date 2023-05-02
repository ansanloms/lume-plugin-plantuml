# lume-plugin-plantuml

[Plantuml](https://plantuml.com/) plugin for [Lume](https://lume.land/).

## Install

Set up [Lume](https://lume.land/docs/overview/installation/) and add the following to your _config.ts:

```typescript
import lume from "lume/mod.ts";
import plantuml from "https://raw.githubusercontent.com/ansanloms/lume-plugin-plantuml/main/mod.ts";

const site = lume();

site.use(plantuml({
  binary: {
    version: "v1.2023.6",
    dest: "./_bin/plantuml.jar",
    checksum:
      "bf2dee10750fd1794ad9eac7de020064d113838ec169448a16b639dbfb67617d",
  },
}));

export default site;
```

First, `plantuml.jar` is downloaded to the path specified in `binary.dest`.
