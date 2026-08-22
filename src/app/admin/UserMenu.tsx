import UserMenuDropdown, { UserMenuGroup, UserMenuLink } from "@/components/UserMenuDropdown";

/**
 * Menu do admin logado (Prompt 16) — dois grupos expansíveis (Clientes, Workers) com
 * os itens do painel, e "Sair" solto ao final, fora dos grupos. Mesmo padrão de
 * dropdown já usado por cliente (Prompt 15) e worker (Prompt 12).
 */
export default function UserMenu({
  nome,
  sairAction,
}: {
  nome: string;
  sairAction: (formData: FormData) => void;
}) {
  return (
    <UserMenuDropdown label={nome}>
      <UserMenuGroup label="Clientes">
        <UserMenuLink href="/admin/clientes/perfil">Perfil</UserMenuLink>
        <UserMenuLink href="/admin/strikes?tipo=cliente">Strikes</UserMenuLink>
      </UserMenuGroup>
      <UserMenuGroup label="Workers">
        <UserMenuLink href="/admin/workers/perfil">Perfil</UserMenuLink>
        <UserMenuLink href="/admin/workers">Aprovar Perfil</UserMenuLink>
        <UserMenuLink href="/admin/workers/portfolio">Portfólio</UserMenuLink>
        <UserMenuLink href="/admin/strikes?tipo=worker">Strikes</UserMenuLink>
        <UserMenuLink href="/admin/repasses">Repasses</UserMenuLink>
        <UserMenuLink href="/admin/disputas">Disputas</UserMenuLink>
      </UserMenuGroup>
      <form action={sairAction}>
        <button
          type="submit"
          className="block w-full border-t border-stone-100 px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
        >
          Sair
        </button>
      </form>
    </UserMenuDropdown>
  );
}
