import {
  Camera,
  CircleOpts,
  Color,
  IPainter,
  LineOpts,
  PolygonOpts,
  Rect,
  RectLike,
  SpriteOpts,
  TextOpts,
  TextureOpts,
  Thing,
  WebGpuPainter,
} from "@vaguevoid/sdk";

export class EditorPainter implements IPainter {
  things: Set<Thing> = new Set();
  #painter: WebGpuPainter;

  constructor(painter: WebGpuPainter) {
    this.#painter = painter;
  }

  startFrame() {
    this.things.clear();
    this.#painter.startFrame();
  }

  thing(thing: Thing) {
    let root: Thing = thing;
    while (root.parent) {
      root = root.parent;
    }
    if (!this.things.has(root) && root.id !== "__root") {
      this.things.add(root);
    }
    this.#painter.thing(thing);
  }

  // below this line is the same as WebGpuPainter

  endFrame() {
    this.#painter.endFrame();
  }

  texture(texturePath: string, values?: Partial<TextureOpts>) {
    this.#painter.texture(texturePath, values);
  }

  sprite(texturePath: string, values?: Partial<SpriteOpts>) {
    this.#painter.sprite(texturePath, values);
  }

  circle(values?: Partial<CircleOpts>) {
    this.#painter.circle(values);
  }

  rect(values?: RectLike) {
    this.#painter.rect(values);
  }

  polygon(values: PolygonOpts) {
    this.#painter.polygon(values);
  }

  line(values: LineOpts) {
    this.#painter.line(values);
  }

  text(text: string, values?: Partial<TextOpts>) {
    this.#painter.text(text, values);
  }

  measureText(text: string, options?: Partial<TextOpts>) {
    return this.#painter.measureText(text, options);
  }

  preloadTextures(texturePaths: string[]) {
    return this.#painter.preloadTextures(texturePaths);
  }

  resize(screen: Rect) {
    this.#painter.resize(screen);
  }

  get camera(): Camera {
    return this.#painter.camera;
  }
  set camera(camera: Camera) {
    this.#painter.camera = camera;
  }

  get clearColor() {
    return this.#painter.clearColor;
  }
  set clearColor(clearColor: Color) {
    this.#painter.clearColor = clearColor;
  }
}
