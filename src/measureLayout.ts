const ELEMENT_NODE = 1;

export interface MeasureLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  top: number;
}

const getRect = (node: HTMLElement) => {
  let offsetParent = node.offsetParent as HTMLElement;
  const height = node.offsetHeight;
  const width = node.offsetWidth;
  let left = node.offsetLeft;
  let top = node.offsetTop;

  while (offsetParent && offsetParent.nodeType === ELEMENT_NODE) {
    left += offsetParent.offsetLeft - offsetParent.scrollLeft;
    top += offsetParent.offsetTop - offsetParent.scrollTop;
    offsetParent = offsetParent.offsetParent as HTMLElement;
  }

  return {
    height,
    left,
    top,
    width
  };
};

const measureLayout = (node: HTMLElement) =>
  new Promise<MeasureLayout>((resolve) => {
    const relativeNode = node && node.parentElement;
    if (node && relativeNode) {
      const relativeRect = getRect(relativeNode);
      const { height, left, top, width } = getRect(node);
      const x = left - relativeRect.left;
      const y = top - relativeRect.top;

      resolve({
        x,
        y,
        width,
        height,
        left,
        top
      });
    }

    resolve({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  });

export default measureLayout;

export const getBoundingClientRect = (node: HTMLElement) =>
  new Promise<MeasureLayout>((resolve) => {
    if (node && node.getBoundingClientRect) {
      const rect = node.getBoundingClientRect();

      resolve({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      });
    }

    resolve({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  });
