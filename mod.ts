import { merge } from "lume/core/utils.ts";
import type { Page, Site } from "lume/core.ts";

import * as path from "./deps/std/path/mod.ts";
import * as fs from "./deps/std/fs/mod.ts";
import { crypto } from "./deps/std/crypto/mod.ts";

export interface Options {
  /**
   * This is the information about plantuml.jar file download.
   */
  binary?: {
    version: string;
    dest: string;
    checksum?: string;
  };

  /**
   * A configuration file to be included before the diagram.
   */
  config?: string;

  /**
   * Cache directory of the generated UML.
   */
  cacheDir?: string;

  /**
   * The list of extensions this plugin applies to.
   */
  extensions: string[];

  /**
   * The css selector to apply this plugin.
   */
  cssSelector: string;

  /**
   * Generate UML.
   */
  generate: (page: Page, uml: string, options: Options) => Promise<HTMLElement>;
}

const sha256 = async (buf: Uint8Array) => {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        buf,
      ),
    ),
  ).map((c) => c.toString(16).padStart(2, "0")).join("");
};

const checksum = async (buf: Uint8Array, hash: string) => {
  return await sha256(buf) === hash;
};

const download = async (
  { version, dest, checksum: hash }: Required<Options>["binary"],
) => {
  const url =
    `https://github.com/plantuml/plantuml/releases/download/${version}/plantuml.jar`;

  console.log(`Downloading ${url}...`);

  if (!(await fs.exists(path.dirname(dest)))) {
    await Deno.mkdir(path.dirname(dest), { recursive: true });
  }

  if (
    await fs.exists(dest) &&
    hash && await checksum(await Deno.readFile(dest), hash)
  ) {
    return;
  }

  const blob = await (await fetch(url)).blob();
  const content = new Uint8Array(await blob.arrayBuffer());
  await Deno.writeFile(dest, content);

  if (hash && !await checksum(await Deno.readFile(dest), hash)) {
    throw new Error("plantuml.jar: checksum mismatch.");
  }
};

const umlToSvg = async (
  jarPath: string,
  uml: string,
  config?: string,
) => {
  const command = new Deno.Command("java", {
    args: [
      "-jar",
      jarPath,
      "-tsvg",
      "-charset",
      "UTF-8",
      "-pipe",
    ].concat(
      ...(config
        ? [
          "-config",
          config,
        ]
        : []),
    ),
    stdin: "piped",
    stdout: "piped",
  });

  const child = command.spawn();
  new Response(uml).body?.pipeTo(child.stdin);

  const { stdout } = await child.output();

  return new TextDecoder().decode(stdout);
};

const getOutput = async (
  input: Parameters<typeof umlToSvg>,
  cacheDir?: string,
) => {
  if (typeof cacheDir === "string") {
    const output = await getOutputByCache(input, cacheDir);
    if (typeof output === "string") {
      return output;
    }
  }

  return await umlToSvg(...input);
};

const getCacheFilename = async (
  input: Parameters<typeof umlToSvg>,
  cacheDir: string,
) => {
  const hash = await sha256(new TextEncoder().encode(JSON.stringify(input)));

  return path.join(
    cacheDir,
    `${hash}.svg`,
  );
};

const getOutputByCache = async (
  input: Parameters<typeof umlToSvg>,
  cacheDir: string,
) => {
  const cacheFile = await getCacheFilename(input, cacheDir);

  if ((await fs.exists(cacheFile))) {
    return await Deno.readTextFile(cacheFile);
  }
};

const setOutputToCache = async (
  input: Parameters<typeof umlToSvg>,
  output: string,
  cacheDir: string,
) => {
  const cacheFile = await getCacheFilename(input, cacheDir);

  if (!(await fs.exists(cacheDir))) {
    await Deno.mkdir(cacheDir, { recursive: true });
  }

  await Deno.writeTextFile(cacheFile, output);
};

export const defaults: Options = {
  extensions: [".html"],
  cssSelector: "pre > code.language-plantuml",
  generate: async (page, uml, options) => {
    const div = page.document!.createElement("div");
    div.classList.add("plantuml");

    if (options.binary?.dest) {
      const output = await getOutput(
        [
          options.binary.dest,
          uml,
          options.config,
        ],
        options.cacheDir,
      );

      div.innerHTML = output;

      if (options.cacheDir) {
        await setOutputToCache(
          [
            options.binary.dest,
            uml,
            options.config,
          ],
          output,
          options.cacheDir,
        );
      }
    }

    return div;
  },
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("beforeBuild", async () => {
      if (options.binary) {
        const binary = await download(options.binary);
      }
    });

    site.process(options.extensions, async (page) => {
      const elements = [
        ...(page.document?.querySelectorAll(options.cssSelector) ||
          []),
      ];

      await Promise.all(elements.map(async (element) => {
        const uml = await options.generate(
          page,
          element.textContent.trim(),
          options,
        );
        element.replaceWith(uml);
      }));
    });
  };
}
