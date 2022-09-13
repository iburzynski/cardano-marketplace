{
  description = "cardano-marketplace";
  inputs = {
      haskellNix.url = "github:input-output-hk/haskell.nix";
      nixpkgs.follows = "haskellNix/nixpkgs-unstable";
      flake-utils.url = "github:numtide/flake-utils";
    };
  outputs = { self, nixpkgs, flake-utils, haskellNix }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ haskellNix.overlay
          (final: _: {
            myProject =
              final.haskell-nix.project' {
                src = ./.;
                compiler-nix-name = "ghc8107";
                shell.tools = {
                    cabal = {};
                    ghcid = {};
                    haskell-language-server = {};
                    hlint = {};
                };
                shell.buildInputs = [
                    pkgs.nodejs
                    ];
                shell.shellHook = ''
                '';
              };
            })
          ];
        pkgs = import nixpkgs {
          inherit system overlays;
          inherit (haskellNix) config;
          };
        flake = pkgs.myProject.flake {
         };
      in
      flake // {
        # packages.default = flake.packages."cardano-marketplace:exe:market-cli";
      });
}
