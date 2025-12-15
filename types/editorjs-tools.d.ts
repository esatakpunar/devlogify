declare module '@editorjs/link' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs'
  
  export interface LinkToolConfig {
    endpoint?: string
  }
  
  export default class LinkTool implements BlockTool {
    constructor(options: BlockToolConstructorOptions<any, LinkToolConfig>)
    render(): HTMLElement
    save(blockContent: HTMLElement): any
    static get toolbox(): { icon: string; title: string }
  }
}

declare module '@editorjs/header' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs'
  
  export interface HeaderConfig {
    placeholder?: string
    levels?: number[]
    defaultLevel?: number
  }
  
  export default class Header implements BlockTool {
    constructor(options: BlockToolConstructorOptions<any, HeaderConfig>)
    render(): HTMLElement
    save(blockContent: HTMLElement): any
    static get toolbox(): { icon: string; title: string }
  }
}

declare module '@editorjs/list' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs'
  
  export interface ListConfig {
    defaultStyle?: 'ordered' | 'unordered'
  }
  
  export default class List implements BlockTool {
    constructor(options: BlockToolConstructorOptions<any, ListConfig>)
    render(): HTMLElement
    save(blockContent: HTMLElement): any
    static get toolbox(): { icon: string; title: string }
  }
}

declare module '@editorjs/code' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs'
  
  export interface CodeConfig {
    placeholder?: string
  }
  
  export default class Code implements BlockTool {
    constructor(options: BlockToolConstructorOptions<any, CodeConfig>)
    render(): HTMLElement
    save(blockContent: HTMLElement): any
    static get toolbox(): { icon: string; title: string }
  }
}

declare module '@editorjs/quote' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs'
  
  export interface QuoteConfig {
    quotePlaceholder?: string
    captionPlaceholder?: string
  }
  
  export default class Quote implements BlockTool {
    constructor(options: BlockToolConstructorOptions<any, QuoteConfig>)
    render(): HTMLElement
    save(blockContent: HTMLElement): any
    static get toolbox(): { icon: string; title: string }
  }
}

declare module '@editorjs/table' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs'
  
  export interface TableConfig {
    rows?: number
    cols?: number
  }
  
  export default class Table implements BlockTool {
    constructor(options: BlockToolConstructorOptions<any, TableConfig>)
    render(): HTMLElement
    save(blockContent: HTMLElement): any
    static get toolbox(): { icon: string; title: string }
  }
}

declare module '@editorjs/delimiter' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs'
  
  export default class Delimiter implements BlockTool {
    constructor(options: BlockToolConstructorOptions)
    render(): HTMLElement
    save(blockContent: HTMLElement): any
    static get toolbox(): { icon: string; title: string }
  }
}

declare module '@editorjs/inline-code' {
  import { InlineTool } from '@editorjs/editorjs'
  
  export default class InlineCode implements InlineTool {
    constructor(options: any)
    render(): HTMLElement
    surround(range: Range): void
    checkState(selection: Selection): boolean
    static get isInline(): boolean
    static get sanitize(): any
  }
}
