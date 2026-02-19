(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "error": "ToastContext-module__MhMH1W__error",
  "info": "ToastContext-module__MhMH1W__info",
  "success": "ToastContext-module__MhMH1W__success",
  "toast": "ToastContext-module__MhMH1W__toast",
  "toastBody": "ToastContext-module__MhMH1W__toastBody",
  "toastClose": "ToastContext-module__MhMH1W__toastClose",
  "toastMessage": "ToastContext-module__MhMH1W__toastMessage",
  "toastRegion": "ToastContext-module__MhMH1W__toastRegion",
  "toastTitle": "ToastContext-module__MhMH1W__toastTitle",
});
}),
"[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ToastProvider",
    ()=>ToastProvider,
    "useToast",
    ()=>useToast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const ToastContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function createToastId() {
    // Avoid pulling in crypto libs on the client; Date+random is fine for UI ids.
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function ToastProvider({ children }) {
    _s();
    const [toasts, setToasts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const timersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({});
    const dismiss = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[dismiss]": (id)=>{
            setToasts({
                "ToastProvider.useCallback[dismiss]": (prev)=>prev.filter({
                        "ToastProvider.useCallback[dismiss]": (t)=>t.id !== id
                    }["ToastProvider.useCallback[dismiss]"])
            }["ToastProvider.useCallback[dismiss]"]);
            const timer = timersRef.current[id];
            if (timer) {
                window.clearTimeout(timer);
                delete timersRef.current[id];
            }
        }
    }["ToastProvider.useCallback[dismiss]"], []);
    const clear = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[clear]": ()=>{
            setToasts([]);
            Object.values(timersRef.current).forEach({
                "ToastProvider.useCallback[clear]": (t)=>window.clearTimeout(t)
            }["ToastProvider.useCallback[clear]"]);
            timersRef.current = {};
        }
    }["ToastProvider.useCallback[clear]"], []);
    const show = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[show]": (toastInput)=>{
            const id = createToastId();
            const durationMs = toastInput.durationMs ?? 4500;
            const toast = {
                id,
                ...toastInput,
                durationMs
            };
            setToasts({
                "ToastProvider.useCallback[show]": (prev)=>[
                        toast,
                        ...prev
                    ].slice(0, 4)
            }["ToastProvider.useCallback[show]"]); // cap to avoid flooding
            if (durationMs > 0) {
                timersRef.current[id] = window.setTimeout({
                    "ToastProvider.useCallback[show]": ()=>dismiss(id)
                }["ToastProvider.useCallback[show]"], durationMs);
            }
        }
    }["ToastProvider.useCallback[show]"], [
        dismiss
    ]);
    const api = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ToastProvider.useMemo[api]": ()=>({
                show,
                success: ({
                    "ToastProvider.useMemo[api]": (message, options)=>show({
                            type: 'success',
                            message,
                            ...options
                        })
                })["ToastProvider.useMemo[api]"],
                error: ({
                    "ToastProvider.useMemo[api]": (message, options)=>show({
                            type: 'error',
                            message,
                            ...options
                        })
                })["ToastProvider.useMemo[api]"],
                info: ({
                    "ToastProvider.useMemo[api]": (message, options)=>show({
                            type: 'info',
                            message,
                            ...options
                        })
                })["ToastProvider.useMemo[api]"],
                dismiss,
                clear
            })
    }["ToastProvider.useMemo[api]"], [
        dismiss,
        clear,
        show
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastContext.Provider, {
        value: api,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].toastRegion,
                "aria-live": "polite",
                "aria-relevant": "additions",
                children: toasts.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].toast} ${__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"][t.type]}`,
                        role: t.type === 'error' ? 'alert' : 'status',
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].toastBody,
                                children: [
                                    t.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].toastTitle,
                                        children: t.title
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.tsx",
                                        lineNumber: 89,
                                        columnNumber: 27
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].toastMessage,
                                        children: t.message
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.tsx",
                                        lineNumber: 90,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.tsx",
                                lineNumber: 88,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].toastClose,
                                "aria-label": "Dismiss notification",
                                onClick: ()=>dismiss(t.id),
                                children: "×"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.tsx",
                                lineNumber: 92,
                                columnNumber: 13
                            }, this)
                        ]
                    }, t.id, true, {
                        fileName: "[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.tsx",
                        lineNumber: 83,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.tsx",
                lineNumber: 81,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.tsx",
        lineNumber: 79,
        columnNumber: 5
    }, this);
}
_s(ToastProvider, "eJyQXojekvmRE/aBtWOxdSnxCGg=");
_c = ToastProvider;
function useToast() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
}
_s1(useToast, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "ToastProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/PROJECTS/POS System/contexts/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const toast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            // Check if user is logged in on mount
            const checkAuth = {
                "AuthProvider.useEffect.checkAuth": async ()=>{
                    try {
                        const response = await fetch('/api/auth/me', {
                            credentials: 'include'
                        });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.user) {
                                setUser(data.user);
                            } else {
                                setUser(null);
                            }
                        } else {
                            setUser(null);
                        }
                    } catch (error) {
                        console.error('Auth check error:', error);
                        setUser(null);
                    }
                    setIsLoading(false);
                }
            }["AuthProvider.useEffect.checkAuth"];
            checkAuth();
        }
    }["AuthProvider.useEffect"], []);
    const login = async (email, password)=>{
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setUser(data.user);
                toast.success('Signed in successfully');
                return true;
            } else {
                toast.error(data.error || 'Login failed');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('An error occurred during login. Please try again.');
            return false;
        }
    };
    const logout = ()=>{
        const run = async ()=>{
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch  {
            // ignore
            } finally{
                setUser(null);
                toast.info('Signed out');
                router.push('/');
            }
        };
        run();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            isLoading,
            login,
            logout,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin'
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/Desktop/PROJECTS/POS System/contexts/AuthContext.tsx",
        lineNumber: 108,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "Ob0u1VsmeaVkwE+h/B7L14w7PUk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/PROJECTS/POS System/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// API utility functions
__turbopack_context__.s([
    "apiRequest",
    ()=>apiRequest,
    "getAuthHeaders",
    ()=>getAuthHeaders
]);
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json'
    };
}
async function apiRequest(endpoint, options = {}) {
    const response = await fetch(endpoint, {
        ...options,
        credentials: 'include',
        headers: {
            ...getAuthHeaders(),
            ...options.headers
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
    }
    return data;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/PROJECTS/POS System/contexts/ProductContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProductProvider",
    ()=>ProductProvider,
    "useProducts",
    ()=>useProducts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/contexts/AuthContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
const ProductContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function ProductProviderContent({ children }) {
    _s();
    const { isAuthenticated, isLoading: authLoading, isAdmin } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const fetchProducts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProductProviderContent.useCallback[fetchProducts]": async ()=>{
            if (!isAuthenticated) {
                setIsLoading(false);
                setProducts([]);
                return [];
            }
            try {
                setIsLoading(true);
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])('/api/products');
                if (data.success) {
                    setProducts(data.products);
                    return data.products;
                }
                return [];
            } catch (error) {
                console.error('Error fetching products:', error);
                // Don't clear products on error, keep existing data
                return [];
            } finally{
                setIsLoading(false);
            }
        }
    }["ProductProviderContent.useCallback[fetchProducts]"], [
        isAuthenticated
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProductProviderContent.useEffect": ()=>{
            // Wait for auth to finish loading, then fetch products if authenticated
            if (authLoading) {
                return;
            }
            fetchProducts();
        }
    }["ProductProviderContent.useEffect"], [
        isAuthenticated,
        authLoading,
        fetchProducts
    ]);
    const addProduct = async (productData)=>{
        if (!isAdmin) {
            throw new Error('Forbidden: Admin access required.');
        }
        try {
            const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])('/api/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            if (data.success) {
                setProducts((prev)=>[
                        ...prev,
                        data.product
                    ]);
            }
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    };
    const updateProduct = async (id, productData)=>{
        if (!isAdmin) {
            throw new Error('Forbidden: Admin access required.');
        }
        try {
            const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])(`/api/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
            if (data.success) {
                setProducts((prev)=>prev.map((product)=>product.id === id ? data.product : product));
            }
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    };
    const deleteProduct = async (id)=>{
        if (!isAdmin) {
            throw new Error('Forbidden: Admin access required.');
        }
        try {
            const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])(`/api/products/${id}`, {
                method: 'DELETE'
            });
            if (data.success) {
                setProducts((prev)=>prev.filter((product)=>product.id !== id));
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    };
    const getProduct = (id)=>{
        return products.find((product)=>product.id === id);
    };
    const refreshProducts = async ()=>{
        return await fetchProducts();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProductContext.Provider, {
        value: {
            products,
            isLoading: isLoading || authLoading,
            addProduct,
            updateProduct,
            deleteProduct,
            getProduct,
            refreshProducts
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/Desktop/PROJECTS/POS System/contexts/ProductContext.tsx",
        lineNumber: 133,
        columnNumber: 5
    }, this);
}
_s(ProductProviderContent, "+/kXF1XXa/GHof2P3SnvkRZ9xwU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = ProductProviderContent;
function ProductProvider({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProductProviderContent, {
        children: children
    }, void 0, false, {
        fileName: "[project]/Desktop/PROJECTS/POS System/contexts/ProductContext.tsx",
        lineNumber: 150,
        columnNumber: 10
    }, this);
}
_c1 = ProductProvider;
function useProducts() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ProductContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
}
_s1(useProducts, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c, _c1;
__turbopack_context__.k.register(_c, "ProductProviderContent");
__turbopack_context__.k.register(_c1, "ProductProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/PROJECTS/POS System/lib/stockAlerts.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_LOW_STOCK_THRESHOLD",
    ()=>DEFAULT_LOW_STOCK_THRESHOLD,
    "getLowStockProducts",
    ()=>getLowStockProducts,
    "isLowStock",
    ()=>isLowStock
]);
const DEFAULT_LOW_STOCK_THRESHOLD = 10;
function isLowStock(stock, threshold = DEFAULT_LOW_STOCK_THRESHOLD) {
    return stock <= threshold;
}
function getLowStockProducts(products, threshold = DEFAULT_LOW_STOCK_THRESHOLD) {
    return products.filter((p)=>isLowStock(p.stock, threshold));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/PROJECTS/POS System/contexts/SalesContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SalesProvider",
    ()=>SalesProvider,
    "useSales",
    ()=>useSales
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ProductContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/contexts/ProductContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/contexts/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$stockAlerts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/lib/stockAlerts.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/contexts/ToastContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
const SalesContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const CART_STORAGE_KEY = 'pos_cart';
function SalesProviderContent({ children }) {
    _s();
    const { isAuthenticated, isLoading: authLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const toast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [sales, setSales] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const { refreshProducts } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ProductContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProducts"])();
    const fetchSales = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SalesProviderContent.useCallback[fetchSales]": async ()=>{
            if (!isAuthenticated) {
                setIsLoading(false);
                setSales([]);
                return;
            }
            try {
                setIsLoading(true);
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])('/api/sales');
                if (data.success) {
                    setSales(data.sales);
                }
            } catch (error) {
                console.error('Error fetching sales:', error);
            // Don't clear sales on error, keep existing data
            } finally{
                setIsLoading(false);
            }
        }
    }["SalesProviderContent.useCallback[fetchSales]"], [
        isAuthenticated
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SalesProviderContent.useEffect": ()=>{
            // Load cart from localStorage (temporary storage)
            const storedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (storedCart) {
                try {
                    setCart(JSON.parse(storedCart));
                } catch (error) {
                    console.error('Error loading cart:', error);
                    localStorage.removeItem(CART_STORAGE_KEY);
                }
            }
        }
    }["SalesProviderContent.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SalesProviderContent.useEffect": ()=>{
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        }
    }["SalesProviderContent.useEffect"], [
        cart
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SalesProviderContent.useEffect": ()=>{
            // Wait for auth to finish loading, then fetch sales if authenticated
            if (authLoading) {
                return;
            }
            fetchSales();
        }
    }["SalesProviderContent.useEffect"], [
        isAuthenticated,
        authLoading,
        fetchSales
    ]);
    const addToCart = (product, quantity = 1)=>{
        setCart((currentCart)=>{
            const existingItem = currentCart.find((item)=>item.product.id === product.id);
            if (existingItem) {
                const updatedCart = currentCart.map((item)=>item.product.id === product.id ? {
                        ...item,
                        quantity: item.quantity + quantity
                    } : item);
                return updatedCart;
            } else {
                const updatedCart = [
                    ...currentCart,
                    {
                        product,
                        quantity
                    }
                ];
                return updatedCart;
            }
        });
    };
    const removeFromCart = (productId)=>{
        setCart((currentCart)=>currentCart.filter((item)=>item.product.id !== productId));
    };
    const updateCartQuantity = (productId, quantity)=>{
        setCart((currentCart)=>{
            if (quantity <= 0) {
                return currentCart.filter((item)=>item.product.id !== productId);
            }
            return currentCart.map((item)=>item.product.id === productId ? {
                    ...item,
                    quantity
                } : item);
        });
    };
    const clearCart = ()=>{
        setCart([]);
    };
    const getCartTotal = ()=>{
        return cart.reduce((total, item)=>total + item.product.price * item.quantity, 0);
    };
    const checkout = async (customerName, paymentMethod = 'cash', customerType = 'regular')=>{
        if (cart.length === 0) {
            throw new Error('Cart is empty');
        }
        try {
            const prevById = new Map(cart.map((i)=>[
                    i.product.id,
                    i.product.stock
                ]));
            // Prepare items for API
            const items = cart.map((item)=>({
                    productId: item.product.id,
                    quantity: item.quantity
                }));
            // Call checkout API
            const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])('/api/sales', {
                method: 'POST',
                body: JSON.stringify({
                    items,
                    customerName,
                    paymentMethod,
                    customerType
                })
            });
            if (data.success) {
                // Refresh products to get updated stock
                const refreshedProducts = await refreshProducts();
                // Optional low-stock toast: only when a product crosses into low stock
                const newlyLow = refreshedProducts.filter((p)=>{
                    const prevStock = prevById.get(p.id);
                    if (prevStock === undefined) return false;
                    return !(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$stockAlerts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLowStock"])(prevStock) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$lib$2f$stockAlerts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLowStock"])(p.stock);
                });
                if (newlyLow.length > 0) {
                    newlyLow.slice(0, 3).forEach((p)=>{
                        toast.info(`${p.name} has only ${p.stock} left`, {
                            title: 'LOW STOCK'
                        });
                    });
                    if (newlyLow.length > 3) {
                        toast.info(`${newlyLow.length - 3} more products are low on stock`, {
                            title: 'LOW STOCK'
                        });
                    }
                }
                // Refresh sales to get the new sale
                await fetchSales();
                // Clear cart
                clearCart();
                return data.sale;
            } else {
                throw new Error('Checkout failed');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            throw error;
        }
    };
    const getSalesByDateRange = (startDate, endDate)=>{
        return sales.filter((sale)=>{
            const saleDate = new Date(sale.timestamp);
            return saleDate >= startDate && saleDate <= endDate;
        });
    };
    const getTotalSales = ()=>{
        return sales.reduce((total, sale)=>total + sale.total, 0);
    };
    const getTotalOrders = ()=>{
        return sales.length;
    };
    const refreshSales = async ()=>{
        await fetchSales();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SalesContext.Provider, {
        value: {
            cart,
            sales,
            isLoading: isLoading || authLoading,
            addToCart,
            removeFromCart,
            updateCartQuantity,
            clearCart,
            getCartTotal,
            checkout,
            getSalesByDateRange,
            getTotalSales,
            getTotalOrders,
            refreshSales
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/Desktop/PROJECTS/POS System/contexts/SalesContext.tsx",
        lineNumber: 237,
        columnNumber: 5
    }, this);
}
_s(SalesProviderContent, "P5UbBbveAYASTAxRV+NMGmc7uQo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$contexts$2f$ProductContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProducts"]
    ];
});
_c = SalesProviderContent;
function SalesProvider({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SalesProviderContent, {
        children: children
    }, void 0, false, {
        fileName: "[project]/Desktop/PROJECTS/POS System/contexts/SalesContext.tsx",
        lineNumber: 260,
        columnNumber: 10
    }, this);
}
_c1 = SalesProvider;
function useSales() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(SalesContext);
    if (context === undefined) {
        throw new Error('useSales must be used within a SalesProvider');
    }
    return context;
}
_s1(useSales, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c, _c1;
__turbopack_context__.k.register(_c, "SalesProviderContent");
__turbopack_context__.k.register(_c1, "SalesProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$PROJECTS$2f$POS__System$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
"[project]/Desktop/PROJECTS/POS System/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/Desktop/PROJECTS/POS System/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=Desktop_PROJECTS_POS%20System_40a72741._.js.map