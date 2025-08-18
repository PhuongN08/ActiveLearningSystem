import { type ComponentType } from "react";
import LazyLoading from "./LazyLoading";

const wrapWithLazy = <P extends object>(
  Component: ComponentType<P>
): ComponentType<P> => {
  const WrappedComponent = (props: P) => (
    <LazyLoading>
      <Component {...props} />
    </LazyLoading>
  );

  return WrappedComponent;
};

export default wrapWithLazy;
