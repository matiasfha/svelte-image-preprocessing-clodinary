export function imagePreprocessor(): {
  /** @type {import('svelte/types/compiler/preprocess').MarkupPreprocessor} */
  markup: import("svelte/types/compiler/preprocess").MarkupPreprocessor;
};
export type PreprocessorGroup =
  import("svelte/types/compiler/preprocess").PreprocessorGroup;
export type BaseNode = import("estree").BaseNode;
export type SyncHandler = import("estree-walker/types/sync").SyncHandler;
export type AsyncHandler = import("estree-walker/types/async").AsyncHandler;
export type WillProcessMsg = {
  willProcess: boolean;
  reason: string | undefined;
  paths: string | undefined;
};

export interface Node extends BaseNode {
  name: string;
  attributes: Array<{
    name: string;
    value: {
      start: number;
      end: number;
      type: string;
      raw: string;
      data: string;
    };
  }>;
}
