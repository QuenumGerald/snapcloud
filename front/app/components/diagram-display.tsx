"use client"

import { useEffect, useRef } from "react"
import mermaid from "mermaid"

interface DiagramDisplayProps {
  diagram: string
}

export function DiagramDisplay({ diagram }: DiagramDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current && diagram) {
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
        },
      })

      // Clear previous content
      containerRef.current.innerHTML = ""

      // Create a unique ID for this diagram
      const diagramId = `diagram-${Date.now()}`

      // Render the diagram
      mermaid
        .render(diagramId, diagram)
        .then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg
          }
        })
        .catch((error) => {
          console.error("Error rendering diagram:", error)
          if (containerRef.current) {
            containerRef.current.innerHTML = `
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-800 font-medium">Error rendering diagram</p>
              <p class="text-red-600 text-sm mt-1">Please try generating the architecture again.</p>
            </div>
          `
          }
        })
    }
  }, [diagram])

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="w-full overflow-x-auto bg-white rounded-lg border p-4"
        style={{ minHeight: "300px" }}
      />
    </div>
  )
}
