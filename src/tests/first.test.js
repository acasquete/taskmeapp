import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasController } from '../services/CanvasController';

vi.mock('fabric', () => ({
  fabric: {
    Canvas: vi.fn().mockImplementation(() => ({
      clear: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      renderAll: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
      getZoom: vi.fn(),
      zoomToPoint: vi.fn(),
      viewportTransform: [1, 0, 0, 1, 0, 0],
      setActiveObject: vi.fn(),
      discardActiveObject: vi.fn(),
      getPointer: vi.fn(),
      requestRenderAll: vi.fn(),
      findTarget: vi.fn(),
      relativePan: vi.fn(),
      getObjects: vi.fn().mockReturnValue([]),
      isDrawingMode: false,
    })),
    Object: vi.fn().mockImplementation(() => ({
    })),
    IText: vi.fn().mockImplementation(() => ({
    })),
  },
}));

vi.mock('./CanvasHistory');
vi.mock('./EditModeController');
vi.mock('./DividerManager');
vi.mock('./CumulativeFlowDiagram');
vi.mock('./ConfigService', () => ({
  Config: vi.fn().mockImplementation(() => ({
  })),
}));

describe('CanvasController', () => {
  let canvasController;
  let canvasMock;
  const { fabric } = require('fabric');

  beforeEach(() => {
    canvasMock = new fabric.Canvas();
    canvasController = new CanvasController(canvasMock);
  });

  it('should properly initialize with a mocked fabric.Canvas instance', () => {
    expect(canvasMock).toBeInstanceOf(fabric.Canvas);
  });

  describe('reset', () => {
    it('should clear the canvas and reset settings', () => {
      canvasController.reset();
      expect(vi.mocked(canvasController.canvas.clear)).toHaveBeenCalled();
    });
  });
});
