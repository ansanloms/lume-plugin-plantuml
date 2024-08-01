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
    version: "v1.2024.6",
    dest: "./_bin/plantuml.jar",
    checksum:
      "5a8dc3b37fe133a4744e55be80caf6080a70350aba716d95400a0f0cbd79e846",
  },
  config: "./plantuml.conf",
  cacheDir: "_cache/plantuml",
}));

export default site;
```

First, `plantuml.jar` is downloaded to the path specified in `binary.dest`.
