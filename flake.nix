{
  # A Nix flake has three top level attributes: `description`, `inputs`, `outputs`

  # `description`: a one-line description shown by `nix flake metadata`
  description = "cardano-marketplace";

  # `inputs`: contains other flakes this flake depends on
  # These are fetched by Nix and passed as arguments to the `outputs` function
  inputs = {
      # Depends on haskell.nix
      haskellNix.url = "github:input-output-hk/haskell.nix";
      # Depends on whichever version of nixpkgs haskell.nix is using
      nixpkgs.follows = "haskellNix/nixpkgs-unstable";
      # Depends on flake-utils
      flake-utils.url = "github:numtide/flake-utils";
    };

  # `outputs`: a function that produces an attribute set
  # the `self` argument refers to *this* flake
  outputs = { self, nixpkgs, flake-utils, haskellNix }:
    # Iterate over list of systems supported by nixpkgs
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ haskellNix.overlay
          # Anonymous curried function - <arg>: <arg>: <function body>
          (final: _: {
            # Overlays are functions accepting two arguments:
            #   * `final` (final package set)
            #   * `prev` (original package set)
            # This overlay will add our project to `pkgs`
            myProject =
              final.haskell-nix.project' {
                # Call `project'` function from `haskell-nix` pkg with the following arguments:
                src = ./.;
                compiler-nix-name = "ghc8107";
                # Configure the development shell used by `nix develop .`
                shell.tools = {
                    # Haskell shell tools go here
                    cabal = {};
                    ghcid = {};
                    haskell-language-server = {};
                    hlint = {};
                };
                shell.buildInputs = [
                    pkgs.python38
                    ];
                shell.shellHook = ''
                  alias update-deps="cd plutus-deps && git pull && python3 update_deps.py && cd .. && cabal update"
                  if [[ -s cabal.project ]] ; then
                    echo "Project already initialized"
                    else
                    git clone "https://github.com/iburzynski/plutus-deps.git"
                    update-deps
                  fi
                '';
              };
            })
          ];
        pkgs = import nixpkgs {
          # `inherit` is used in attribute sets or `let` bindings to inherit variables from the parent scope
          # equivalent to `system = system`, `overlays = overlays`
          inherit system overlays;
          # equivalent to `config = haskellNix.config`
          inherit (haskellNix) config;

          };

        flake = pkgs.myProject.flake {  };
      in
      flake // {
      });
}
