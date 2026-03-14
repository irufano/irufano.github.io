import IrufanoDevLogo from "./IrufanoDevLogo";

const Logo = ({ type = "irufano_dev" }: { type?: string }) => {
  switch (type) {
    case "irufano_dev":
      return <IrufanoDevLogo />;
    default:
      return <IrufanoDevLogo />;
  }
};

export default Logo;
