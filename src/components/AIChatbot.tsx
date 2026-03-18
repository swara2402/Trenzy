import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchProducts, type Product } from "@/lib/data";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
}

const quickActions = [
  { label: "Popular Products", action: "show popular products" },
  { label: "Best Deals", action: "show best deals" },
  { label: "Track Order", action: "track my order" },
  { label: "Return Policy", action: "what is your return policy" },
];

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your SmartCart AI shopping assistant. I can help you find products, track orders, answer questions, and more. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
    const response = await processMessage(messages);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again or rephrase your question.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

const processMessage = async (messages: Message[]): Promise<Message> => {
    const lowerMessage = message.toLowerCase();

    for (const action of quickActions) {
      if (lowerMessage.includes(action.action) || lowerMessage.includes(action.label.toLowerCase())) {
        return handleAction(action.action);
      }
    }

    if (lowerMessage.includes("search") || lowerMessage.includes("find") || lowerMessage.includes("looking for")) {
      const searchTerm = message.replace(/^(search|find|looking for)\s+/i, "").trim();
      return handleProductSearch(searchTerm);
    }

    if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("how much")) {
      const searchTerm = message.replace(/^(what\s+is\s+the\s+price\s+of|how\s+much\s+(is|does))\s+/i, "").trim();
      return handleProductSearch(searchTerm);
    }

    if (lowerMessage.includes("track") || lowerMessage.includes("order status") || lowerMessage.includes("where is my order")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "To track your order, please go to the Orders page in your account. You'll find real-time tracking information there. You can also find your order number in the confirmation email.",
      };
    }

    if (lowerMessage.includes("return") || lowerMessage.includes("refund")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "We offer a 30-day return policy for most products. Items must be unused and in their original packaging. To initiate a return, go to your Orders page and select the item you wish to return. Our team will process your refund within 5-7 business days after receiving the returned item.",
      };
    }

    if (lowerMessage.includes("shipping") || lowerMessage.includes("delivery") || lowerMessage.includes("deliver")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "We offer free shipping on orders above ₹500. Standard delivery takes 3-7 business days. Express delivery (1-2 days) is available for an additional fee. Delivery is available across India.",
      };
    }

    if (lowerMessage.includes("payment") || lowerMessage.includes("pay") || lowerMessage.includes("card")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "We accept multiple payment methods:\n• Credit/Debit Cards (Visa, Mastercard, RuPay)\n• UPI (Google Pay, PhonePe, Paytm)\n• Net Banking\n• Cash on Delivery (COD)\n\nAll payments are secure and encrypted.",
      };
    }

    if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "I can help you with:\n• Finding products and checking prices\n• Order tracking and status\n• Shipping and delivery information\n• Return and refund policies\n• Payment methods\n• Product recommendations\n\nJust ask me anything!",
      };
    }

    return handleProductSearch(message);
  };

  const handleAction = async (action: string): Promise<Message> => {
    switch (action) {
      case "show popular products":
        return handleProductSearch("");
      case "show best deals":
        return handleProductSearch("deals");
      default:
        return {
          id: Date.now().toString(),
          role: "assistant",
          content: "I understand you're asking about " + action + ". Let me help you with that.",
        };
    }
  };

  const handleProductSearch = (term: string): Message => {
    let products: Product[] = [];
    
    if (term) {
      products = searchProducts(term).slice(0, 4);
    } else {
      // Show popular products - sort by popularity
      products = [...searchProducts("")].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
    }

    if (products.length === 0) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: `I couldn't find any products matching "${term}". Try different keywords or browse our categories.`,
      };
    }

    return {
      id: Date.now().toString(),
      role: "assistant",
      content: term 
        ? `Here are some products matching "${term}":`
        : "Here are our most popular products:",
      products,
    };
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 z-40"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 w-96 bg-background border rounded-xl shadow-2xl z-50 flex flex-col ${
            isMinimized ? "h-14" : "h-[500px]"
          }`}
        >
          <div 
            className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">SmartCart AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="p-1 hover:bg-white/20 rounded"
              >
                {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.products && message.products.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.products.map((product) => (
                            <a
                              key={product.id}
                              href={`/product/${product.id}`}
                              className="flex items-center gap-2 p-2 bg-background rounded-lg hover:bg-accent transition-colors"
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.brand}</p>
                                <p className="text-sm font-semibold">₹{product.price}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length <= 2 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.action)}
                      className="text-xs px-3 py-1 bg-muted hover:bg-accent rounded-full transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(input);
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

