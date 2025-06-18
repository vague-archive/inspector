import { Colors, IPainter, Rect, Thing, vec } from "@vaguevoid/sdk";
import { Ipc } from "@vaguevoid/tools";
import { onBeforeUnmount, onMounted } from "vue";

const config = {
  cornerSize: 12,
};

export function onShow(cb: () => void) {
  if (Ipc.isChildWindow()) {
    let loadTime = -1;
    onMounted(() => {
      cb();
      loadTime = performance.now();
    });
    return Ipc.listenWillShow(() => {
      if (performance.now() - loadTime < 100) {
        console.warn(`Ignoring show event because it was too soon`);
      } else {
        cb();
      }
    });
  } else {
    onMounted(cb);
    return noop;
  }
}

export function onHide(cb: () => void) {
  if (Ipc.isChildWindow()) {
    return Ipc.listenWillHide(cb);
  } else {
    onBeforeUnmount(cb);
    return noop;
  }
}

export function noop() {}

export function label(thing: Thing) {
  return (
    thing.label ??
    (thing.id === "__root"
      ? "Scene"
      : thing.tags.length
      ? thing.tags.join(" ") || `Thing ${thing.id.substring(0, 6)}`
      : thing.id.length >= 21
      ? `Thing ${thing.id.substring(0, 6)}`
      : thing.id)
  );
}

export function boundingBox(things: Thing[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const thing of things) {
    for (const bound of thing.bounds()) {
      minX = Math.min(minX, bound.x);
      minY = Math.min(minY, bound.y);
      maxX = Math.max(maxX, bound.x);
      maxY = Math.max(maxY, bound.y);
    }
  }

  const midpoint = vec(minX + (maxX - minX) / 2, minY + (maxY - minY) / 2);
  return new Rect({
    x: midpoint.x,
    y: midpoint.y,
    width: maxX - minX,
    height: maxY - minY,
  });
}

export function hoverRect(
  painter: IPainter,
  rect: Thing,
  color = Colors.Palette.LIME
) {
  const box = boundingBox(rect.all());
  painter.rect({
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    color: { ...color, a: 0.5 },
    rotation: 0,
  });
}

export function highlightRect(
  painter: IPainter,
  rect: Thing,
  color = Colors.Palette.MAGENTA
) {
  const box = boundingBox(rect.all());
  box.width += 5;
  box.height += 5;

  const edges = box.edges();
  for (const edge of edges) {
    painter.line({
      from: edge.from,
      to: edge.to,
      color,
      thickness: 2,
    });
  }

  const bounds = box.bounds();

  for (const bound of bounds) {
    painter.rect({
      x: bound.x,
      y: bound.y,
      width: config.cornerSize,
      height: config.cornerSize,
      color: Colors.Palette.BLUE,
      scale: vec(1.2),
      rotation: 0,
    });

    painter.rect({
      x: bound.x,
      y: bound.y,
      width: config.cornerSize,
      height: config.cornerSize,
      color: Colors.Palette.WHITE,
      rotation: 0,
    });
  }
}
