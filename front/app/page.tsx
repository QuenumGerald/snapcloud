"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, MessageCircle, X, Minimize2, Maximize2, Edit3, Save, Download, Cloud } from "lucide-react"
import { DiagramEditor } from "./components/diagram-editor"
import { ChatMessage } from "./components/chat-message"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ArchitectureResult {
  tasks: string[]
  deliverables: {
    diagramMermaid: string
    cfnTemplate: string
    costEstimation: {
      json: any
      table: string
    }
  }
}

export default function AWSArchitectureDiagramTool() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your SnapCloud AI assistant. Describe the system you want to build on AWS and I'll create a comprehensive architecture with 3 deliverables: diagram, CloudFormation template, and cost estimation. I focus on AWS best practices, security, scalability, and cost optimization.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)
  const [chatMinimized, setChatMinimized] = useState(false)
  const [currentDiagram, setCurrentDiagram] = useState("")
  const [currentTemplate, setCurrentTemplate] = useState("")
  const [currentCostEstimation, setCurrentCostEstimation] = useState<{json: any, table: string} | null>(null)
  const [activeTab, setActiveTab] = useState<'diagram' | 'template' | 'cost'>('diagram')
  const [isEditing, setIsEditing] = useState(false)
  const [editedDiagram, setEditedDiagram] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirement: input,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate architecture")
      }

      const data: ArchitectureResult = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Here are your 3 AWS deliverables:\n\n📊 **Architecture Diagram** (Mermaid)\n☁️ **CloudFormation Template**\n💰 **Cost Estimation**: ${data.deliverables.costEstimation.json.totalMonthlyCost} ${data.deliverables.costEstimation.json.currency}/month\n\n**Tasks identified**: ${data.tasks.join(', ')}`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setCurrentDiagram(data.deliverables.diagramMermaid)
      setCurrentTemplate(data.deliverables.cfnTemplate)
      setCurrentCostEstimation(data.deliverables.costEstimation)
      setEditedDiagram(data.deliverables.diagramMermaid)
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error generating the AWS architecture. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSaveDiagram = () => {
    setCurrentDiagram(editedDiagram)
    setIsEditing(false)
  }

  const handleExportDiagram = () => {
    const element = document.createElement("a")
    const file = new Blob([currentDiagram], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "aws-architecture-diagram.mmd"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const awsExamplePrompts = [
    "Create a scalable e-commerce platform using AWS services with auto-scaling and RDS",
    "Design a serverless data processing pipeline using Lambda, S3, and DynamoDB",
    "Build a microservices architecture on EKS with API Gateway and Application Load Balancer",
    "Create a real-time analytics platform using Kinesis, Lambda, and QuickSight",
    "Design a secure multi-tier web application with VPC, EC2, and RDS",
    "Build a content delivery system using CloudFront, S3, and Route 53",
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 to-blue-50 relative overflow-hidden">
      {/* Main Diagram Area */}
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-orange-500" />
              <h1 className="text-xl font-semibold text-gray-900">SnapCloud</h1>
            </div>
            {currentDiagram && (
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                AWS Diagram Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentDiagram && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(!isEditing)
                    if (!isEditing) setEditedDiagram(currentDiagram)
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
                {isEditing && (
                  <Button size="sm" onClick={handleSaveDiagram} className="bg-orange-600 hover:bg-orange-700">
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleExportDiagram}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Deliverables Display */}
        <div className="flex-1 p-4">
          {currentDiagram ? (
            <div className="h-full">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button 
                  onClick={() => setActiveTab('diagram')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'diagram' 
                      ? 'text-orange-600 border-b-2 border-orange-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📊 Architecture Diagram
                </button>
                <button 
                  onClick={() => setActiveTab('template')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'template' 
                      ? 'text-orange-600 border-b-2 border-orange-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ☁️ CloudFormation Template
                </button>
                <button 
                  onClick={() => setActiveTab('cost')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'cost' 
                      ? 'text-orange-600 border-b-2 border-orange-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  💰 Cost Estimation
                </button>
              </div>
              
              {/* Tab Content */}
              <div className="h-[calc(100%-3rem)]">
                {activeTab === 'diagram' && (
                  <DiagramEditor
                    diagram={isEditing ? editedDiagram : currentDiagram}
                    isEditing={isEditing}
                    onDiagramChange={setEditedDiagram}
                  />
                )}
                
                {activeTab === 'template' && (
                  <div className="h-full bg-white rounded-lg border p-4 overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">CloudFormation Template</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const element = document.createElement('a');
                          const file = new Blob([currentTemplate], { type: 'text/yaml' });
                          element.href = URL.createObjectURL(file);
                          element.download = 'aws-architecture.yaml';
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download YAML
                      </Button>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto font-mono">
                      {currentTemplate}
                    </pre>
                  </div>
                )}
                
                {activeTab === 'cost' && currentCostEstimation && (
                  <div className="h-full bg-white rounded-lg border p-4 overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Cost Estimation</h3>
                      <div className="text-2xl font-bold text-orange-600">
                        ${currentCostEstimation.json.totalMonthlyCost}/month
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Cost Table */}
                      <div>
                        <h4 className="text-md font-semibold mb-3">Cost Breakdown</h4>
                        <div className="prose prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ 
                            __html: currentCostEstimation.table.replace(/\n/g, '<br>').replace(/\|/g, '|') 
                          }} />
                        </div>
                      </div>
                      
                      {/* JSON Details */}
                      <div>
                        <h4 className="text-md font-semibold mb-3">Detailed Breakdown</h4>
                        <div className="space-y-2">
                          {currentCostEstimation.json.breakdown.map((item: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{item.service}</span>
                                <span className="text-orange-600 font-semibold">${item.monthlyCost}</span>
                              </div>
                              {item.instanceType && (
                                <div className="text-sm text-gray-600">Type: {item.instanceType}</div>
                              )}
                              {item.quantity && (
                                <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Cloud className="h-10 w-10 text-orange-600" />
                </div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-3">Ready to Design on AWS</h2>
                <p className="text-gray-600 mb-8 text-lg">
                  Use the SnapCloud AI assistant below to describe your system and generate 3 comprehensive
                  AWS deliverables: architecture diagram, CloudFormation template, and cost estimation.
                </p>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 mb-4">Try these AWS architecture examples:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {awsExamplePrompts.slice(0, 4).map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(prompt)}
                        className="text-left p-3 text-sm bg-white hover:bg-orange-50 rounded-lg border border-gray-200 hover:border-orange-200 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <div className="font-medium text-gray-900 mb-1">Example {index + 1}</div>
                        <div className="text-gray-600">"{prompt}"</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      {chatOpen && (
        <div
          className={`fixed bottom-4 left-4 bg-white rounded-lg shadow-xl border transition-all duration-300 ${
            chatMinimized ? "w-80 h-12" : "w-96 h-96"
          }`}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-orange-50 to-blue-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <Cloud className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-sm">SnapCloud AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatMinimized(!chatMinimized)}
                className="h-6 w-6 p-0"
              >
                {chatMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {!chatMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 h-64">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {loading && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <span className="text-sm">Designing AWS architecture...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your system for SnapCloud to generate AWS architecture..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !input.trim()}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chat Toggle Button (when closed) */}
      {!chatOpen && (
        <Button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 left-4 rounded-full w-12 h-12 p-0 bg-orange-600 hover:bg-orange-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
