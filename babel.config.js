module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Transform import.meta.env.X → process.env.X (Metro doesn't handle import.meta)
      function () {
        return {
          visitor: {
            MetaProperty(path) {
              // import.meta.env.MODE → process.env.MODE
              // import.meta.env → process.env
              const { parent } = path;
              if (
                parent.type === "MemberExpression" &&
                parent.property.type === "Identifier" &&
                parent.property.name === "env"
              ) {
                path.replaceWithSourceString("process");
              } else if (
                parent.type === "MemberExpression" &&
                parent.property.type === "Identifier" &&
                parent.property.name === "url"
              ) {
                // import.meta.url → ""
                const grandParent = path.parentPath;
                grandParent.replaceWithSourceString('""');
              }
            },
          },
        };
      },
    ],
  };
};
