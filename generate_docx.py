import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def set_table_borders(table, color="CCCCCC", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def build_document():
    doc = docx.Document()

    # Page setup - A4
    sections = doc.sections
    for section in sections:
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Base style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(17, 24, 39)

    # 1. Header (Centered College Banner)
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(0)
    p_inst.paragraph_format.space_after = Pt(2)
    r = p_inst.add_run("VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY, ERODE - 12\n(AUTONOMOUS)\nDEPARTMENT OF INFORMATION TECHNOLOGY")
    r.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(30, 58, 138)

    p_ay = doc.add_paragraph()
    p_ay.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ay.paragraph_format.space_before = Pt(0)
    p_ay.paragraph_format.space_after = Pt(2)
    r = p_ay.add_run("ACADEMIC YEAR: 2026 - 27 (ODD)")
    r.bold = True
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(71, 85, 105)

    p_act = doc.add_paragraph()
    p_act.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_act.paragraph_format.space_before = Pt(0)
    p_act.paragraph_format.space_after = Pt(14)
    r = p_act.add_run("ACTIVITY - Project-Based Assessment")
    r.bold = True
    r.font.size = Pt(11.5)
    r.font.color.rgb = RGBColor(30, 58, 138)

    # 2. Student & Project Info Table
    meta_table = doc.add_table(rows=5, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(meta_table, "94A3B8", "6")

    meta_data = [
        [("NAME", True), ("Rahul G", False), ("CLASS", True), ("24IT5A", False)],
        [("REG. NO", True), ("732924ITR089", False), ("SUBJECT CODE", True), ("22ITT53", False)],
        [("SUBJECT NAME", True), ("FORMAL LANGUAGES AND AUTOMATA THEORY (FLAT)", False), ("", False), ("", False)],
        [("PROBLEM STATEMENT", True), ("Build a web application that enforces valid lifecycle state transitions in an online food ordering and real-time delivery tracking system using a Deterministic Finite Automaton (DFA). Prevent illegal state transitions, state-skipping, and post-fulfillment modifications through formal automata validation. Display order progress, state transition matrices, and rejection proofs on an interactive web dashboard.", False), ("", False), ("", False)],
        [("TITLE ASSIGNED", True), ("Online Food Ordering and Delivery Tracking System Using DFA", False), ("", False), ("", False)]
    ]

    for row_idx, row_content in enumerate(meta_data):
        row = meta_table.rows[row_idx]
        if row_idx in [2, 3, 4]:
            # Merge col 1, 2, 3
            cell_label = row.cells[0]
            cell_val = row.cells[1]
            cell_val.merge(row.cells[2]).merge(row.cells[3])
            
            cell_label.text = row_content[0][0]
            set_cell_background(cell_label, "F1F5F9")
            set_cell_margins(cell_label, 120, 120, 150, 150)
            cell_label.paragraphs[0].runs[0].font.bold = True
            cell_label.paragraphs[0].runs[0].font.size = Pt(10)
            cell_label.paragraphs[0].runs[0].font.color.rgb = RGBColor(15, 23, 42)

            cell_val.text = row_content[1][0]
            set_cell_margins(cell_val, 120, 120, 150, 150)
            if row_content[1][1]:
                cell_val.paragraphs[0].runs[0].font.bold = True
            cell_val.paragraphs[0].runs[0].font.size = Pt(10)
            cell_val.paragraphs[0].runs[0].font.color.rgb = RGBColor(15, 23, 42)
        else:
            for col_idx in range(4):
                cell = row.cells[col_idx]
                text, is_bold = row_content[col_idx]
                cell.text = text
                set_cell_margins(cell, 120, 120, 150, 150)
                if is_bold:
                    set_cell_background(cell, "F1F5F9")
                p = cell.paragraphs[0]
                if p.runs:
                    p.runs[0].font.bold = is_bold
                    p.runs[0].font.size = Pt(10)
                    p.runs[0].font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Helper for Section Titles
    def add_sec_title(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.bold = True
        r.font.size = Pt(13)
        r.font.color.rgb = RGBColor(30, 58, 138)
        return p

    def add_subsec_title(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.bold = True
        r.font.size = Pt(11.5)
        r.font.color.rgb = RGBColor(15, 23, 42)
        return p

    # --- SECTION 1 ---
    add_sec_title("1. STATE DIAGRAM")

    add_subsec_title("1.1 Introduction")
    p = doc.add_paragraph(
        "A Deterministic Finite Automaton (DFA) is used in the Online Food Ordering and Delivery Tracking System "
        "project to model, govern, and strictly validate the complete lifecycle of customer orders. In commercial food delivery "
        "applications, orders must strictly follow an operational sequence: from initial order placement, kitchen staff confirmation, "
        "cooking preparation, packaging, dispatch via courier, to final delivery handover."
    )
    p.paragraph_format.space_after = Pt(6)

    p = doc.add_paragraph(
        "The automaton starts from the initial state S0 (Order Created). Whenever authorized actors (customer, kitchen manager, "
        "delivery partner) submit an action, the DFA evaluates the transition function δ(state, action). If the action is legally defined "
        "for the current state, the DFA advances deterministically to the next state. If an undefined action or illegal state jump is "
        "attempted (e.g., trying to dispatch food before cooking, or cancelling food after preparation has commenced), the transition is "
        "strictly rejected with mathematical proof. When the order reaches S5 (Delivered) or S6 (Cancelled), it enters a final/accepting state "
        "with zero outgoing transitions, guaranteeing that completed orders cannot be altered."
    )
    p.paragraph_format.space_after = Pt(10)

    add_subsec_title("1.2 States of the DFA")
    states_data = [
        ("S0", "Order Created", "Customer placed food order. Awaiting restaurant acceptance or cancellation.", "Initial State (q0)"),
        ("S1", "Order Confirmed", "Restaurant verified and accepted order. Assigned to kitchen preparation queue.", "Intermediate State"),
        ("S2", "Preparation Started", "Chef began cooking ingredients. Cancellation locked to prevent restaurant wastage.", "Intermediate State"),
        ("S3", "Food Prepared", "Cooking completed; dishes packed in insulated boxes; ready for courier pickup.", "Intermediate State"),
        ("S4", "Out for Delivery", "Assigned delivery courier picked up package; traveling to customer address.", "Intermediate State"),
        ("S5", "Delivered", "Package safely handed over to customer. Order lifecycle successfully fulfilled.", "Final / Accepting (F)"),
        ("S6", "Cancelled", "Order cancelled by customer in S0/S1 or rejected by restaurant. Terminal state.", "Final / Terminal (F)")
    ]

    tbl_states = doc.add_table(rows=1 + len(states_data), cols=4)
    tbl_states.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_states, "94A3B8", "4")

    headers = ["State", "Formal Label", "Description", "State Category"]
    for col_idx, h_text in enumerate(headers):
        cell = tbl_states.rows[0].cells[col_idx]
        cell.text = h_text
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, 100, 100, 120, 120)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(10)

    for row_idx, data_row in enumerate(states_data):
        row = tbl_states.rows[1 + row_idx]
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data_row):
            cell = row.cells[col_idx]
            cell.text = val
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 120, 120)
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9.5)
            if col_idx == 0:
                p.runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_subsec_title("1.3 State Diagram Representation :")
    p = doc.add_paragraph(
        "Online Food Ordering & Delivery Tracking – DFA State Diagram\n"
        "The automaton contains seven states. It guarantees deterministic progression along the main fulfillment pipeline "
        "(S0 → S1 → S2 → S3 → S4 → S5) and accepts controlled cancellation branches to S6 only before food preparation starts."
    )
    p.paragraph_format.space_after = Pt(6)

    # ASCII State diagram in box
    diag_box = doc.add_table(rows=1, cols=1)
    diag_box.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(diag_box, "CBD5E1", "6")
    cell = diag_box.rows[0].cells[0]
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, 150, 150, 180, 180)
    ascii_diag = (
        "       [Start]\n"
        "          │\n"
        "          ▼\n"
        "       ┌──────┐      confirm      ┌──────┐  start_prep   ┌──────┐  food_ready   ┌──────┐\n"
        "       │  S0  │ ────────────────> │  S1  │ ────────────> │  S2  │ ────────────> │  S3  │\n"
        "       └──────┘                   └──────┘               └──────┘               └──────┘\n"
        "          │                          │                                              │\n"
        "          │ cancel                   │ cancel                                       │ dispatch\n"
        "          ▼                          ▼                                              ▼\n"
        "       ┌────────────────────────────────┐                                       ┌──────┐\n"
        "       │           (( S6 ))             │                                       │  S4  │\n"
        "       │          [CANCELLED]           │                                       └──────┘\n"
        "       └────────────────────────────────┘                                           │\n"
        "                                                                                    │ deliver\n"
        "                                                                                    ▼\n"
        "                                                                                ╔══════╗\n"
        "                                                                                ║  S5  ║  [DELIVERED]\n"
        "                                                                                ╚══════╝  (FINAL STATE)\n"
    )
    cell.text = ascii_diag
    p = cell.paragraphs[0]
    p.runs[0].font.name = 'Consolas'
    p.runs[0].font.size = Pt(8.5)
    p.runs[0].font.color.rgb = RGBColor(30, 41, 59)

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(4)
    p_cap.paragraph_format.space_after = Pt(8)
    r = p_cap.add_run("Figure 1: Complete 7-state Deterministic Finite Automaton (DFA) state diagram for food ordering & delivery tracking.")
    r.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(71, 85, 105)

    p_desc = doc.add_paragraph(
        "State Description:\n"
        "• S0 – Initial state (q0); customer placed order; awaiting kitchen confirmation.\n"
        "• S1 – Order confirmed by restaurant; queued for preparation.\n"
        "• S2 – Food preparation started; chef cooking; cancellation locked.\n"
        "• S3 – Food preparation finished; items inspected and packed.\n"
        "• S4 – Out for delivery; delivery courier traveling to customer location.\n"
        "• S5 – Delivered; package handed over; order completed successfully (Final State ∈ F).\n"
        "• S6 – Cancelled; order cancelled or rejected before cooking started (Final State ∈ F)."
    )
    p_desc.paragraph_format.space_after = Pt(10)

    add_subsec_title("1.4 Formal Definition of DFA")
    p = doc.add_paragraph("A Deterministic Finite Automaton is represented by the 5-tuple:")
    p.paragraph_format.space_after = Pt(4)

    p_form = doc.add_paragraph()
    p_form.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_form.add_run("M = (Q, Σ, δ, q0, F)")
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(30, 58, 138)
    p_form.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Where:\n"
        "• Q: Finite set of states = {S0, S1, S2, S3, S4, S5, S6}\n"
        "• Σ: Finite input alphabet = {confirm, start_preparation, food_ready, dispatch, deliver, cancel}\n"
        "• δ: Partial state transition function δ: Q × Σ → Q\n"
        "• q0: Initial state = S0 (Order Created)\n"
        "• F: Set of final / accepting states = {S5, S6} (S5 = Delivered, S6 = Cancelled)"
    )

    doc.add_paragraph(
        "Language Accepted by the Automaton L(M):\n"
        "The DFA accepts any sequence of operational events that terminates in an accepting state F = {S5, S6}:\n"
        "L(M) = { confirm · start_preparation · food_ready · dispatch · deliver,  cancel,  confirm · cancel }"
    ).paragraph_format.space_after = Pt(14)

    # --- SECTION 2 ---
    add_sec_title("2. TRANSITION DIAGRAM")
    p = doc.add_paragraph(
        "The transition diagram represents the movement of the DFA from one state to another based on incoming "
        "operational events dispatched from the client application."
    )
    p.paragraph_format.space_after = Pt(6)

    add_subsec_title("2.1 Transition Table :")
    transitions_data = [
        ("S0", "confirm", "S1", "δ(S0, confirm) = S1 (Order accepted into kitchen queue)"),
        ("S0", "cancel", "S6", "δ(S0, cancel) = S6 (Cancelled by customer or rejected)"),
        ("S1", "start_preparation", "S2", "δ(S1, start_prep) = S2 (Chef begins cooking dishes)"),
        ("S1", "cancel", "S6", "δ(S1, cancel) = S6 (Cancelled before cooking commences)"),
        ("S2", "food_ready", "S3", "δ(S2, food_ready) = S3 (Cooking complete; food packed)"),
        ("S3", "dispatch", "S4", "δ(S3, dispatch) = S4 (Delivery partner assigned & traveling)"),
        ("S4", "deliver", "S5", "δ(S4, deliver) = S5 (Food delivered to customer)"),
        ("S5", "Any σ ∈ Σ", "∅ (REJECT)", "δ(S5, σ) is undefined; terminal accepting state"),
        ("S6", "Any σ ∈ Σ", "∅ (REJECT)", "δ(S6, σ) is undefined; terminal cancelled state")
    ]

    tbl_trans = doc.add_table(rows=1 + len(transitions_data), cols=4)
    tbl_trans.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_trans, "94A3B8", "4")

    headers = ["Current State (q)", "Input Condition (σ)", "Next State (δ)", "Formal Transition Proof & Description"]
    for col_idx, h_text in enumerate(headers):
        cell = tbl_trans.rows[0].cells[col_idx]
        cell.text = h_text
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, 100, 100, 120, 120)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(10)

    for row_idx, data_row in enumerate(transitions_data):
        row = tbl_trans.rows[1 + row_idx]
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data_row):
            cell = row.cells[col_idx]
            cell.text = val
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 120, 120)
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9.5)
            if col_idx in [0, 2]:
                p.runs[0].font.bold = True

    p_spec = doc.add_paragraph(
        "\nSpecial Conditions:\n"
        "• Undefined Transitions: Any transition not explicitly defined above evaluates to ∅ and is rejected by the backend with an HTTP 422 Unprocessable Entity status.\n"
        "• Cancellation Lock: Beyond state S1, the cancel action is strictly undefined (δ(S2, cancel) = ∅), preventing customer cancellation after raw materials have been cooked.\n"
        "• Terminal Invariance: Both S5 and S6 have zero outgoing transitions (δ(S5, σ) = ∅, δ(S6, σ) = ∅), guaranteeing that completed or cancelled orders are immutable."
    )
    p_spec.paragraph_format.space_after = Pt(10)

    add_subsec_title("2.2 Example of State Transitions :")
    p = doc.add_paragraph("Consider an order placed by customer Alex Morgan (Order ID #692a4e) progressing from placement to delivery:")
    p.paragraph_format.space_after = Pt(6)

    example_data = [
        ("Initial", "Customer", "Order Placed", "—", "S0", "q0 = S0"),
        ("1", "Restaurant Admin", "confirm", "S0", "S1", "δ(S0, confirm) = S1"),
        ("2", "Kitchen Chef", "start_preparation", "S1", "S2", "δ(S1, start_prep) = S2"),
        ("3", "Kitchen Chef", "food_ready", "S2", "S3", "δ(S2, food_ready) = S3"),
        ("4", "Delivery Partner", "dispatch", "S3", "S4", "δ(S3, dispatch) = S4"),
        ("5", "Delivery Partner", "deliver", "S4", "S5", "δ(S4, deliver) = S5 ∈ F")
    ]

    tbl_ex = doc.add_table(rows=1 + len(example_data), cols=6)
    tbl_ex.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_ex, "94A3B8", "4")

    headers = ["Step", "Actor", "Action", "Prev", "Next", "Formal Proof"]
    for col_idx, h_text in enumerate(headers):
        cell = tbl_ex.rows[0].cells[col_idx]
        cell.text = h_text
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(9.5)

    for row_idx, data_row in enumerate(example_data):
        row = tbl_ex.rows[1 + row_idx]
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(data_row):
            cell = row.cells[col_idx]
            cell.text = val
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 100, 100)
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9)
            if col_idx in [3, 4]:
                p.runs[0].font.bold = True

    doc.add_paragraph(
        "\nResult: After detecting five sequential valid transitions, the DFA enters accepting state S5, "
        "and the system confirms successful order delivery."
    ).paragraph_format.space_after = Pt(14)

    # --- CODE SECTION ---
    add_sec_title("CODE:")
    p = doc.add_paragraph("File Name: orderDfa.js (Location: server/src/dfa/orderDfa.js)")
    p.paragraph_format.space_after = Pt(4)

    code_content = """export const STATES = Object.freeze({
  S0: 'Order Created',
  S1: 'Order Confirmed',
  S2: 'Food Preparation Started',
  S3: 'Food Prepared',
  S4: 'Out for Delivery',
  S5: 'Delivered',
  S6: 'Cancelled'
});

export const INITIAL_STATE = 'S0';
export const FINAL_STATES = Object.freeze(['S5', 'S6']);

export const ALPHABET = Object.freeze([
  'confirm',
  'start_preparation',
  'food_ready',
  'dispatch',
  'deliver',
  'cancel'
]);

// State Transition Table delta: Q x Sigma -> Q (Partial Function)
export const TRANSITIONS = Object.freeze({
  S0: Object.freeze({ confirm: 'S1', cancel: 'S6' }),
  S1: Object.freeze({ start_preparation: 'S2', cancel: 'S6' }),
  S2: Object.freeze({ food_ready: 'S3' }),
  S3: Object.freeze({ dispatch: 'S4' }),
  S4: Object.freeze({ deliver: 'S5' }),
  S5: Object.freeze({}),
  S6: Object.freeze({})
});

export function isFinalState(state) {
  return FINAL_STATES.includes(state);
}

export function getValidActions(state) {
  const transitionsFromState = TRANSITIONS[state];
  return transitionsFromState ? Object.keys(transitionsFromState) : [];
}

// Executes DFA transition: delta(currentState, input) -> nextState
export function transition(currentState, input) {
  if (!STATES[currentState]) {
    return { valid: false, error: `Invalid state "${currentState}".`, allowedActions: [] };
  }
  if (!ALPHABET.includes(input)) {
    return { valid: false, error: `Invalid symbol "${input}".`, allowedActions: getValidActions(currentState) };
  }
  if (isFinalState(currentState)) {
    return { valid: false, error: `Cannot transition from final state "${currentState}".`, allowedActions: [] };
  }

  const nextState = TRANSITIONS[currentState]?.[input];
  if (!nextState) {
    const valid = getValidActions(currentState);
    return {
      valid: false,
      error: `Transition delta(${currentState}, "${input}") is undefined. Allowed: ${valid.join(' or ')}.`,
      allowedActions: valid
    };
  }

  return {
    valid: true,
    currentState,
    input,
    nextState,
    label: STATES[nextState],
    isFinal: isFinalState(nextState),
    formalExplanation: `delta(${currentState}, ${input}) = ${nextState}`
  };
}"""

    code_tbl = doc.add_table(rows=1, cols=1)
    code_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(code_tbl, "334155", "6")
    cell = code_tbl.rows[0].cells[0]
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, 140, 140, 160, 160)
    cell.text = code_content
    p = cell.paragraphs[0]
    p.runs[0].font.name = 'Consolas'
    p.runs[0].font.size = Pt(8.5)
    p.runs[0].font.color.rgb = RGBColor(248, 250, 252)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # --- OUTPUT SECTION ---
    add_sec_title("Output:")
    out_content = (
        "> rahul-project1-api@1.0.0 test\n"
        "> node --test\n\n"
        "✔ DFA Formal 5-tuple M = (Q, Sigma, delta, q0, F) definition verification (3.17ms)\n"
        "✔ Valid transitions delta(q, a) match the formal state transition table (0.51ms)\n"
        "✔ Strictly rejects state-skipping and undefined transitions (delta is a partial function) (0.62ms)\n"
        "✔ Strictly protects terminal states F = {S5, S6} from any outgoing transitions (0.28ms)\n"
        "✔ Rejects unknown states and invalid input alphabet symbols (0.21ms)\n"
        "✔ Simulates string sequences w in Sigma* and verifies language membership L(M) (0.39ms)\n"
        "✔ getDfaMetadata returns complete mathematical model (0.31ms)\n\n"
        "ℹ tests 7\n"
        "ℹ suites 0\n"
        "ℹ pass 7\n"
        "ℹ fail 0\n"
        "ℹ duration_ms 139.01\n\n"
        "Step 1: Input symbol: 'confirm'           -> State: S0 -> S1 [Order Confirmed]\n"
        "Step 2: Input symbol: 'start_preparation' -> State: S1 -> S2 [Preparation Started]\n"
        "Step 3: Input symbol: 'food_ready'        -> State: S2 -> S3 [Food Prepared]\n"
        "Step 4: Input symbol: 'dispatch'          -> State: S3 -> S4 [Out for Delivery]\n"
        "Step 5: Input symbol: 'deliver'           -> State: S4 -> S5 [Delivered] (FINAL STATE)\n\n"
        "STATUS: STRING ACCEPTED BY AUTOMATON M!"
    )

    out_tbl = doc.add_table(rows=1, cols=1)
    out_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(out_tbl, "374151", "6")
    cell = out_tbl.rows[0].cells[0]
    set_cell_background(cell, "111827")
    set_cell_margins(cell, 140, 140, 160, 160)
    cell.text = out_content
    p = cell.paragraphs[0]
    p.runs[0].font.name = 'Consolas'
    p.runs[0].font.size = Pt(8.5)
    p.runs[0].font.color.rgb = RGBColor(16, 185, 129)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Embed visual screenshots if available
    img_dfa = os.path.abspath("docs/screenshots/05_dfa_visualizer.png")
    if os.path.exists(img_dfa):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture(img_dfa, width=Inches(6.0))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(10)
        r = p_cap.add_run("Figure 3: Interactive DFA Visualizer and String Sequence Simulator web interface (/dfa).")
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(71, 85, 105)

    img_rej = os.path.abspath("docs/screenshots/10_invalid_transition.png")
    if os.path.exists(img_rej):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(2)
        doc.add_picture(img_rej, width=Inches(5.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(12)
        r = p_cap.add_run("Figure 4: Formal mathematical rejection proof (HTTP 422) when an illegal transition is attempted.")
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(71, 85, 105)

    # --- PROCEDURE STEPS ---
    add_sec_title("PROCEDURE STEPS :")
    steps = [
        "Start the MongoDB database service to make the database available for the application (or rely on the automated in-memory MongoDB fallback).",
        "Open the FoodDelivery-DFA-System project folder in Visual Studio Code.",
        "Open the backend folder in the terminal and install the required Node.js dependencies using npm install.",
        "Configure the MongoDB connection details in the backend environment file (or use default configuration).",
        "Execute npm test to verify all 7 formal DFA unit test cases validating 5-tuple properties, partial transitions, and terminal states.",
        "Start the backend server and frontend development server concurrently using npm run dev.",
        "Open the Food Delivery application in a web browser using the local URL http://localhost:5173/ or the live Vercel URL https://fooddelivery-dfa-system.vercel.app.",
        "Sign in with customer credentials or restaurant administrator credentials.",
        "Place an order from the menu and observe initial state creation in S0 (Order Created).",
        "Open the Live Tracking view (/track/:id) to view real-time DFA state progression received via WebSocket.",
        "In the Kitchen Admin Dashboard (/admin), advance the order through confirmed (S1), cooking (S2), prepared (S3), and dispatched (S4).",
        "Verify that attempting an illegal transition (e.g., dispatch from S0 or cancel from S2) returns an HTTP 422 error and mathematical proof.",
        "Navigate to the DFA Visualizer (/dfa) and simulate custom symbol sequences using the interactive string simulator.",
        "Verify the final output when the order reaches final state S5 (Delivered) and confirm that terminal state protection prevents further alterations."
    ]

    for idx, step_text in enumerate(steps, 1):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.left_indent = Inches(0.25)
        r_num = p.add_run(f"{idx}. ")
        r_num.bold = True
        p.add_run(step_text)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # --- ADVANTAGES ---
    add_sec_title("ADVANTAGES OF USING FLAT CONCEPT IN ONLINE FOOD ORDERING AND DELIVERY TRACKING SYSTEM :")
    advantages = [
        ("Pattern Recognition: ", "Formally recognizes valid order processing workflows as regular languages over the operational alphabet Σ."),
        ("Automatic Validation: ", "Validates all operational actions mathematically before executing database state updates."),
        ("Fast Deterministic Processing: ", "Processes order lifecycle events in O(1) time complexity through simple state transition matrix lookups."),
        ("Zero Illegal State Jumping: ", "Eliminates race conditions and API forgery by mathematically preventing skipping intermediate states (e.g., jumping from S0 directly to S5)."),
        ("Business Rule Integrity: ", "Locks customer cancellation once cooking begins by defining δ(S2, cancel) = ∅, eliminating restaurant food wastage."),
        ("Terminal State Security: ", "Guarantees that delivered (S5) and cancelled (S6) orders remain strictly immutable with zero outgoing transitions.")
    ]

    for title, desc in advantages:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.left_indent = Inches(0.25)
        r_bullet = p.add_run("• ")
        r_bullet.bold = True
        r_title = p.add_run(title)
        r_title.bold = True
        p.add_run(desc)

    # Save document
    out_path = os.path.abspath("FLAT_PROJECT_ASSESSMENT_REPORT.docx")
    doc.save(out_path)
    print(f"✅ Successfully created: {out_path}")

if __name__ == "__main__":
    build_document()
