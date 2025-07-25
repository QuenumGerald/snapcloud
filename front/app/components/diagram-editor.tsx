"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { Textarea } from "@/components/ui/textarea"

interface DiagramEditorProps {
  diagram: string
  isEditing: boolean
  onDiagramChange: (diagram: string) => void
}

export function DiagramEditor({ diagram, isEditing, onDiagramChange }: DiagramEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderError, setRenderError] = useState<string | null>(null)

  useEffect(() => {
    if (containerRef.current && diagram && !isEditing) {
      // Initialize mermaid
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 14,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
          padding: 20,
        },
        themeVariables: {
          primaryColor: "#3b82f6",
          primaryTextColor: "#1f2937",
          primaryBorderColor: "#2563eb",
          lineColor: "#6b7280",
          secondaryColor: "#f3f4f6",
          tertiaryColor: "#ffffff",
        },
      })

      // Clear previous content
      containerRef.current.innerHTML = ""
      setRenderError(null)

      // Create a unique ID for this diagram
      const diagramId = `diagram-${Date.now()}`

      // Render the diagram
      mermaid
        .render(diagramId, diagram)
        .then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg

            // Make the SVG responsive
            const svgElement = containerRef.current.querySelector("svg")
            if (svgElement) {
              svgElement.style.width = "100%"
              svgElement.style.height = "auto"
              svgElement.style.maxHeight = "100%"
            }
          }
        })
        .catch((error) => {
          console.error("Error rendering diagram:", error)
          setRenderError(error.message || "Failed to render diagram")
        })
    }
  }, [diagram, isEditing])

  if (isEditing) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Edit Diagram Code</h3>
          <p className="text-sm text-gray-600">
            Modify the Mermaid diagram syntax below. Changes will be applied when you save.
          </p>
        </div>
        <Textarea
          value={diagram}
          onChange={(e) => onDiagramChange(e.target.value)}
          className="flex-1 font-mono text-sm resize-none"
          placeholder="Enter Mermaid diagram syntax..."
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {renderError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Diagram Render Error</h3>
            <p className="text-gray-600 mb-4">{renderError}</p>
            <p className="text-sm text-gray-500">Try editing the diagram or ask the assistant to fix the syntax.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-200 p-8"
            style={{ minHeight: "500px" }}
          />
        </div>
      )}
    </div>
  )
}
