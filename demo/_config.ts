import lume from "lume/mod.ts";

import plantuml from "../mod.ts";

const site = lume();
site.use(plantuml({
  binary: {
    version: "v1.2023.6",
    dest: "./_bin/plantuml.jar",
    checksum:
      "bf2dee10750fd1794ad9eac7de020064d113838ec169448a16b639dbfb67617d",
  },
  config: "./plantuml.conf",
  cacheDir: "_cache/plantuml",
}));

export default site;
