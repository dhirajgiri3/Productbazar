"use client";
import { useEffect, useState, useRef } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
// Remove incorrect import
// import { loadFull } from "@tsparticles/all";

// Only use the correct import
import { loadAll } from "@tsparticles/all";

const InteractiveBackground = () => {
  const [init, setInit] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  // Improved initialization with error handling
  useEffect(() => {
    const initializeParticles = async () => {
      try {
        await initParticlesEngine(async (engine) => {
          // Fix: Use the proper loading function with error handling
          try {
            await loadAll(engine);
            console.log("Particles engine loaded with loadAll");
          } catch (loadError) {
            console.error("Error loading with loadAll:", loadError);
            // If loadAll fails, we could try an alternative loading method
            // This would require importing the alternative method
            throw loadError; // Re-throw to be caught by outer try/catch
          }
        });
        setInit(true);
        console.log("Particles engine initialized successfully");
      } catch (err) {
        console.error("Failed to initialize particles engine:", err);
        setError(err.message);
      }
    };

    initializeParticles();
  }, []);

  const particlesLoaded = (container) => {
    console.log("Particles container loaded", container);
    // Force a redraw to ensure visibility
    if (container) {
      setTimeout(() => {
        try {
          container.refresh();
          console.log("Container refreshed successfully");
        } catch (err) {
          console.error("Error refreshing container:", err);
        }
      }, 200);
    }
  };

  // Error display for debugging
  if (error) {
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center text-red-500">
        <p>Error initializing particles: {error}</p>
      </div>
    );
  }

  if (init) {
    return (
      <div className="fixed inset-0 -z-10" ref={containerRef}>
        {/* Base background color layer - changed to white */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white" />

        {/* Particles container with explicit dimensions and positioning */}
        <div className="absolute inset-0 overflow-hidden">
          <Particles
            id="tsparticles"
            className="absolute inset-0"
            particlesLoaded={particlesLoaded}
            options={{
              fullScreen: {
                enable: false,
                zIndex: 0
              },
              fpsLimit: 120,
              detectRetina: true,
              background: {
                color: {
                  value: "#ffffff00",
                },
              },
              interactivity: {
                detect_on: "canvas",
                events: {
                  onClick: {
                    enable: true,
                    mode: "push",
                  },
                  onHover: {
                    enable: true,
                    mode: "bubble",
                    parallax: {
                      enable: true,
                      force: 80,
                      smooth: 10
                    },
                  },
                  resize: true,
                },
                modes: {
                  push: {
                    quantity: 10,
                    groups: ["stars", "symbols"]
                  },
                  bubble: {
                    distance: 200,
                    size: 12,
                    duration: 2,
                    opacity: 0.8,
                    speed: 3,
                  },
                  repulse: {
                    distance: 150,
                    duration: 0.8,
                    speed: 1,
                  },
                  grab: {
                    distance: 200,
                    links: {
                      opacity: 0.7,
                      color: "#ffffff"
                    }
                  },
                  light: {
                    area: {
                      gradient: {
                        start: "#ffffff",
                        stop: "#000000"
                      }
                    },
                    shadow: {
                      color: "#000000"
                    }
                  }
                },
              },
              particles: {
                groups: {
                  stars: {
                    number: {
                      value: 40
                    },
                    shape: {
                      type: ["star", "character"],
                      options: {
                        star: {
                          sides: 5,
                          inset: 2
                        },
                        character: {
                          value: ["✦", "✧", "✴", "✺", "✵", "⚝", "★", "☆"]
                        }
                      }
                    },
                    opacity: {
                      value: { min: 0.3, max: 0.9 }
                    },
                    size: {
                      value: { min: 2, max: 8 }
                    },
                    color: {
                      value: [
                        "#9333ea", // Purple
                        "#7c3aed", // Violet
                        "#6366f1", // Indigo
                        "#8b5cf6", // Purple
                        "#a855f7", // Purple
                        "#d946ef"  // Fuchsia
                      ]
                    },
                    move: {
                      enable: true,
                      speed: { min: 0.3, max: 1 },
                      direction: "none",
                      random: true,
                      straight: false,
                      outMode: "bounce"
                    },
                    twinkle: {
                      lines: {
                        enable: false
                      },
                      particles: {
                        enable: true,
                        frequency: 0.05,
                        opacity: 1,
                        color: {
                          value: ["#a855f7", "#d946ef"]
                        }
                      }
                    }
                  },
                  symbols: {
                    number: {
                      value: 30
                    },
                    shape: {
                      type: ["circle", "triangle", "polygon"],
                      options: {
                        polygon: [
                          { sides: 5 },
                          { sides: 6 }
                        ]
                      }
                    },
                    opacity: {
                      value: { min: 0.3, max: 0.8 },
                      animation: {
                        enable: true,
                        speed: 0.5,
                        minimumValue: 0.1,
                        sync: false
                      }
                    },
                    size: {
                      value: { min: 1, max: 5 },
                      animation: {
                        enable: true,
                        speed: 2,
                        minimumValue: 0.5,
                        sync: false
                      }
                    },
                    color: {
                      value: [
                        "#9333ea", // Purple
                        "#6366f1", // Indigo
                        "#06b6d4", // Cyan
                        "#8b5cf6", // Purple
                        "#d946ef", // Fuchsia
                        "#ec4899", // Pink
                      ]
                    },
                    move: {
                      enable: true,
                      speed: { min: 0.5, max: 2 },
                      direction: "none",
                      random: true,
                      straight: false,
                      outMode: "out",
                      path: {
                        enable: true,
                        delay: { value: 0 },
                        options: {
                          size: 5,
                          draw: false,
                          increment: 0.001
                        }
                      },
                      trail: {
                        enable: true,
                        length: 5,
                        fillColor: "#ffffff" // Changed to white
                      }
                    },
                    rotate: {
                      value: { min: 0, max: 360 },
                      direction: "random",
                      animation: {
                        enable: true,
                        speed: 5
                      }
                    },
                    wobble: {
                      enable: true,
                      distance: 10,
                      speed: { min: 10, max: 15 }
                    }
                  },
                  nebula: {
                    number: {
                      value: 30 // Reduced number
                    },
                    shape: {
                      type: "circle"
                    },
                    opacity: {
                      value: { min: 0.05, max: 0.2 } // Reduced opacity for white bg
                    },
                    size: {
                      value: { min: 15, max: 40 }
                    },
                    color: {
                      value: [
                        "#c084fc", // Purple
                        "#818cf8", // Indigo
                        "#67e8f9", // Cyan
                        "#f0abfc", // Fuchsia
                        "#fb7185"  // Rose
                      ]
                    },
                    move: {
                      enable: true,
                      speed: { min: 0.1, max: 0.5 },
                      direction: "none",
                      random: true,
                      straight: false,
                      outMode: "out"
                    },
                    wobble: {
                      enable: true,
                      distance: 20,
                      speed: { min: 1, max: 3 }
                    },
                    blur: {
                      enable: true,
                      value: 5
                    }
                  }
                },
                number: {
                  value: 0, // Still using groups instead
                  density: {
                    enable: true,
                    area: 1000
                  }
                },
                color: {
                  value: "#a855f7" // Default color for any ungrouped particles
                },
                links: {
                  enable: true,
                  distance: 150,
                  color: "#a855f7", // Updated link color for white bg
                  opacity: 0.5,
                  width: 1,
                  triangles: {
                    enable: true,
                    color: "#c084fc",
                    opacity: 0.1
                  },
                  frequency: 0.01,
                  consent: false
                },
                move: {
                  enable: true,
                  speed: 1,
                  direction: "none",
                  random: true,
                  straight: false,
                  outModes: {
                    default: "out"
                  },
                },
              },
              motion: {
                disable: false,
                reduce: {
                  factor: 4,
                  value: true
                }
              },
              emitters: [
                {
                  direction: "top-right",
                  rate: {
                    delay: 5,
                    quantity: 3
                  },
                  position: {
                    x: 0,
                    y: 100
                  },
                  size: {
                    width: 0,
                    height: 0
                  },
                  particles: {
                    groups: ["stars"],
                    opacity: {
                      value: { min: 0.3, max: 0.8 }
                    },
                    size: {
                      value: { min: 1, max: 4 }
                    },
                    color: {
                      value: "#a855f7" // Updated emitter color
                    },
                    move: {
                      speed: { min: 1, max: 3 },
                      outMode: "destroy"
                    },
                    life: {
                      count: 1,
                      duration: {
                        value: { min: 5, max: 10 }
                      }
                    }
                  }
                },
                {
                  direction: "top-left",
                  rate: {
                    delay: 7,
                    quantity: 2
                  },
                  position: {
                    x: 100,
                    y: 100
                  },
                  size: {
                    width: 0,
                    height: 0
                  },
                  particles: {
                    groups: ["symbols"],
                    color: {
                      value: "#8b5cf6" // Updated emitter color
                    },
                    move: {
                      speed: { min: 1, max: 3 },
                      outMode: "destroy"
                    },
                    life: {
                      count: 1,
                      duration: {
                        value: { min: 5, max: 10 }
                      }
                    }
                  }
                }
              ],
              themes: [
                {
                  name: "light", // Changed to light theme
                  default: {
                    value: true,
                    mode: "light"
                  }
                }
              ]
            }}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              pointerEvents: "auto",
              zIndex: 1
            }}
          />
        </div>

        {/* Gradient overlays for depth and dimension - changed to light colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-violet-100/30 z-[2]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-purple-50/40 z-[2]" />

        {/* Light effects and glow - adjusted for white background */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-200/10 to-transparent z-[2]" />
        <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-violet-200/20 to-transparent z-[2]" />
      </div>
    );
  }

  // Updated loading state for white background
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-purple-700">Loading colorful particles...</p>
      </div>
    </div>
  );
};

export default InteractiveBackground;