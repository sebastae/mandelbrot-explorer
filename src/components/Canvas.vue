<template>
  <div class="canvas-container">
    <canvas ref="canvas" :width="width" :height="height"></canvas>
    <div class="display-info">
      <span>Width: {{ width }}</span>
      <span>Height: {{ height }}</span>
      <span>
        View: {{ view.x0 }}, {{ view.y0 }}, {{ view.x1 }}, {{ view.y1 }}
      </span>
      <span> Mouse: {{ cMousePosition.x }}, {{ cMousePosition.y }} </span>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import Mandelbrot from "../mandelbrot";

export default defineComponent({
  setup() {
    const canvas = ref(null);
    const height = ref(document.body.clientHeight);
    const width = ref(document.body.clientWidth);
    const aspectRatio = height.value / width.value;
    const view = ref({
      x0: -(2.4 / aspectRatio) * 0.7,
      y0: -1.2,
      x1: (2.4 / aspectRatio) * 0.3,
      y1: 1.2,
    });
    const drag = ref(false);
    const iterations = ref(100);
    const mousePosition = ref({ x: 0, y: 0 });
    const zoomFactor = 0.9;

    const cMousePosition = computed(() => {
      return getViewCoordsFromScreenCoords(
        mousePosition.value.x,
        mousePosition.value.y
      );
    });

    onMounted(() => {
      const cvs = canvas.value as unknown as HTMLCanvasElement;
      const gl = cvs.getContext("webgl");
      if (!gl) {
        console.error("WebGL is not supported");
        return;
      }

      const mandelbrot = new Mandelbrot(gl);

      // Handle events

      // Handle resize
      const onResize = makeOnResizeHandler(mandelbrot);
      window.addEventListener("resize", onResize);

      // Handle mouse
      const onMouseMove = makeMouseMoveHandler(mandelbrot);
      window.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("mousemove", onMouseMove);

      const onDblClick = makeDblClickHandler(mandelbrot);
      window.addEventListener("dblclick", onDblClick);

      // Handle wheel
      const onScroll = makeScrollHandler(mandelbrot);
      window.addEventListener("wheel", onScroll);

      // Remove event listeners before unmounting
      onBeforeUnmount(() => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("wheel", onScroll);
      });

      // Render
      renderCanvas(mandelbrot);
    });

    function getViewCoordsFromScreenCoords(x: number, y: number) {
      return {
        x: (x / width.value) * (view.value.x1 - view.value.x0) + view.value.x0,
        y: (y / height.value) * (view.value.y1 - view.value.y0) + view.value.y0,
      };
    }

    function makeScrollHandler(mandelbrot: Mandelbrot) {
      return (e: WheelEvent) => {
        const sign = Math.sign(e.deltaY);
        const zoom = sign === -1 ? zoomFactor : 1 / zoomFactor;

        const newViewWidth = zoom * (view.value.x1 - view.value.x0);
        const newViewHeight = zoom * (view.value.y1 - view.value.y0);

        const vMousePos = getViewCoordsFromScreenCoords(e.clientX, e.clientY);

        const newViewX0 =
          vMousePos.x - newViewWidth * (e.clientX / width.value);
        const newViewY0 =
          vMousePos.y - newViewHeight * (e.clientY / height.value);

        view.value = {
          x0: newViewX0,
          y0: newViewY0,
          x1: newViewX0 + newViewWidth,
          y1: newViewY0 + newViewHeight,
        };

        renderCanvas(mandelbrot);
      };
    }

    function makeOnResizeHandler(mandelbrot: Mandelbrot) {
      return () => {
        height.value = document.body.clientHeight;
        width.value = document.body.clientWidth;
        nextTick(() => renderCanvas(mandelbrot));
      };
    }

    function makeDblClickHandler(mandelbrot: Mandelbrot) {
      return () => {
        view.value = {
          x0: -(2.4 / aspectRatio) * 0.7,
          y0: -1.2,
          x1: (2.4 / aspectRatio) * 0.3,
          y1: 1.2,
        };
        renderCanvas(mandelbrot);
      };
    }

    function onMouseDown(ev: MouseEvent) {
      drag.value = true;
      ev.preventDefault();
    }

    function onMouseUp(ev: MouseEvent) {
      drag.value = false;
    }

    function makeMouseMoveHandler(mandelbrot: Mandelbrot) {
      return (ev: MouseEvent) => {
        if (drag.value) {
          const movement = mapMovement(ev.movementX, ev.movementY);
          view.value = {
            x0: view.value.x0 + movement.x * -1,
            y0: view.value.y0 + movement.y,
            x1: view.value.x1 + movement.x * -1,
            y1: view.value.y1 + movement.y,
          };
          renderCanvas(mandelbrot);
        }
        mousePosition.value = { x: ev.clientX, y: ev.clientY };
      };
    }

    function renderCanvas(mandelbrot: Mandelbrot): void {
      mandelbrot.update(view.value);
    }

    function mapMovement(x: number, y: number): { x: number; y: number } {
      return {
        x: (x / width.value) * (view.value.x1 - view.value.x0),
        y: (y / height.value) * (view.value.y1 - view.value.y0),
      };
    }

    return {
      canvas,
      height,
      width,
      drag,
      iterations,
      view,
      cMousePosition,
    };
  },
});
</script>

<style scoped>
.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.display-info {
  visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: start;
  color: white;
}
</style>
