module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./apps/frontend",
            "@ui": "./libs/ui",
            "@api": "./libs/api",
            "@models": "./libs/models",
            "@utils": "./libs/utils",
          },
        },
      ],
    ],
  };
};
