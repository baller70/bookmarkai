// @ts-nocheck
import React, { useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ColumnList } from './ColumnList';
import { Toolbar } from './Toolbar';
import { useKanbanStore } from '../hooks/useKanbanStore';

export const KanbanCanvas: React.FC<{ boardId: string }> = () => {
  const { columns } = useKanbanStore();
  const transformRef = useRef<any>(null);

  const addColumn = () => {
    /* TODO: implement */
    alert('Add column clicked');
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Toolbar
        onAddColumn={addColumn}
        zoomIn={() => transformRef.current?.zoomIn(0.2)}
        zoomOut={() => transformRef.current?.zoomOut(0.2)}
        resetZoom={() => transformRef.current?.resetTransform()}
      />

      <TransformWrapper ref={transformRef} minScale={0.5} maxScale={1.5} wheel={{ step: 0.1 }}>
        <TransformComponent wrapperClass="flex-1 overflow-hidden">
          <div className="p-8 min-w-[100vw]">
            <ColumnList />
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}; 