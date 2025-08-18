import { Spin } from "antd";
import { Suspense, type ReactNode } from "react";

interface LazyLoadingProps {
  children: ReactNode;
}

export default function LazyLoading({
  children,
}: LazyLoadingProps) {
  return (
    <Suspense
      fallback={
        <div
          className="loading-center"
          style={{ height: "100vh" }}
        >
          <Spin />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
