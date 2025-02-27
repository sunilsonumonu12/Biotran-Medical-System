class MacroProcessor:
    def __init__(self, source_lines):
        self.source_lines = source_lines
        self.macro_defs = {}

    def pass1(self):
        output_lines = []
        in_macro_def = False
        current_macro = None

        for line in self.source_lines:
            stripped = line.strip()
            # Detect the start of a macro definition.
            if stripped.upper() == "MACRO":
                in_macro_def = True
                continue

            if in_macro_def:
                # Check for end of macro definition.
                if stripped.upper() == "MEND":
                    in_macro_def = False
                    if current_macro:
                        self.macro_defs[current_macro["name"]] = current_macro
                        current_macro = None
                    continue

                # The first line inside a macro definition is the header.
                if current_macro is None:
                    # Expected header format: MACRONAME [param1, param2, ...]
                    tokens = stripped.split()
                    if not tokens:
                        continue
                    name = tokens[0]
                    params = []
                    if len(tokens) > 1:
                        # Parameters separated by commas.
                        params = [p.strip() for p in ' '.join(tokens[1:]).split(',')]
                    current_macro = {"name": name, "params": params, "body": []}
                else:
                    # Add the line to the macro's body.
                    current_macro["body"].append(stripped)
            else:
                # Line outside any macro definition is kept for expansion.
                output_lines.append(line)
        return output_lines

    def expand_macros(self, lines):
        expanded_lines = []
        for line in lines:
            stripped_line = line.strip()
            if not stripped_line:
                expanded_lines.append(line)
                continue

            tokens = stripped_line.split()
            first_token = tokens[0]

            # Check if the line begins with a macro invocation.
            if first_token in self.macro_defs:
                macro_def = self.macro_defs[first_token]
                actual_params = []
                if len(tokens) > 1:
                    # Extract actual parameters from the line.
                    params_part = ' '.join(tokens[1:])
                    actual_params = [p.strip() for p in params_part.split(',')]

                expansion = []
                # Replace formal parameters with actual parameters in the macro body.
                for macro_line in macro_def["body"]:
                    expanded_line = macro_line
                    for formal, actual in zip(macro_def["params"], actual_params):
                        expanded_line = expanded_line.replace(formal, actual)
                    expansion.append(expanded_line)

                # Recursively check for nested macro invocations.
                nested_expansion = self.expand_macros(expansion)
                expanded_lines.extend(nested_expansion)
            else:
                # If it's not a macro call, add the line as is.
                expanded_lines.append(line)
        return expanded_lines

    def process(self):
        non_macro_lines = self.pass1()
        final_lines = self.expand_macros(non_macro_lines)
        return final_lines



if __name__ == "__main__":
    # Input program using only the ADD macro definition and invocation.
    source_program = [
        "MACRO",
        "ADD A, B",           # Macro header: defines macro 'ADD' with parameters A and B.
        "    MOV R1, A",       # Macro body: use parameter A.
        "    ADD R1, B",       # Macro body: use parameter B.
        "    MOV C, R1",       # Macro body.
        "MEND",
        "MOV X, Y",           # A normal instruction.
        "ADD R2, R3",         # Macro invocation: should expand ADD with R2 for A and R3 for B.
        "MOV Z, W"            # Another normal instruction.
    ]

    processor = MacroProcessor(source_program)
    expanded_program = processor.process()

    print("Expanded Program:")
    for line in expanded_program:
        print(line)
